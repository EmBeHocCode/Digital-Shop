import { debugLog, logError } from '../../../core/logger/logger.js';
import { getSqliteDb } from '../../../infrastructure/database/connection.js';
import { sendTextMessage } from '../../../shared/utils/message/messageSender.js';

type DiceSide = 'tai' | 'xiu';

interface ParsedInput {
  hasBang: boolean;
  command: string;
  args: string[];
}

interface GameAccountRow {
  user_id: string;
  balance: number;
  last_daily_claim_date: string | null;
}

interface MinigameContext {
  api: any;
  threadId: string;
  text: string;
  senderId: string;
  senderName?: string;
}

export interface MinigameResult {
  handled: boolean;
  responseTexts: string[];
}

const DAILY_REWARD = 1000;
const TAI_XIU_MIN_BET = 100;
const TAI_XIU_WAIT_MS = 5000;
const TAI_XIU_PAYOUT_MULTIPLIER = 1.95;
const TZ_VIETNAM = 'Asia/Ho_Chi_Minh';
const pendingTaiXiu = new Set<string>();

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseInput(text: string): ParsedInput {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const candidate = lines[lines.length - 1] ?? text.trim();
  const hasBang = candidate.startsWith('!');
  const withoutBang = hasBang ? candidate.slice(1).trim() : candidate;
  const [commandRaw, ...args] = withoutBang.split(/\s+/).filter(Boolean);
  return {
    hasBang,
    command: normalize(commandRaw ?? ''),
    args,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCoins(value: number): string {
  return value.toLocaleString('vi-VN');
}

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ_VIETNAM }).format(new Date());
}

function normalizeSide(raw: string): DiceSide | null {
  const token = normalize(raw);
  if (token === 'tai') return 'tai';
  if (token === 'xiu') return 'xiu';
  return null;
}

function sideLabel(side: DiceSide): string {
  return side === 'tai' ? 'Tài' : 'Xỉu';
}

function ensureAccount(userId: string): GameAccountRow {
  const sqlite = getSqliteDb();
  const row = sqlite
    .query('SELECT user_id, balance, last_daily_claim_date FROM game_accounts WHERE user_id = ?')
    .get(userId) as GameAccountRow | null;
  if (row) return row;

  const now = Date.now();
  sqlite
    .query(
      `
      INSERT INTO game_accounts (user_id, balance, last_daily_claim_date, created_at, updated_at)
      VALUES (?, 0, NULL, ?, ?)
    `,
    )
    .run(userId, now, now);

  return {
    user_id: userId,
    balance: 0,
    last_daily_claim_date: null,
  };
}

function getBalance(userId: string): number {
  return ensureAccount(userId).balance;
}

function claimDaily(userId: string): { ok: boolean; text: string } {
  const sqlite = getSqliteDb();
  const account = ensureAccount(userId);
  const today = todayKey();

  if (account.last_daily_claim_date === today) {
    return {
      ok: false,
      text: `🎁 Bạn đã nhận !daily hôm nay rồi. Số dư hiện tại: ${formatCoins(account.balance)} xu.`,
    };
  }

  const now = Date.now();
  sqlite
    .query(
      `
      UPDATE game_accounts
      SET balance = balance + ?, last_daily_claim_date = ?, updated_at = ?
      WHERE user_id = ?
    `,
    )
    .run(DAILY_REWARD, today, now, userId);

  const balance = getBalance(userId);
  return {
    ok: true,
    text: [
      `🎁 Nhận thưởng ngày thành công: +${formatCoins(DAILY_REWARD)} xu.`,
      `💰 Số dư hiện tại: ${formatCoins(balance)} xu.`,
    ].join('\n'),
  };
}

function reserveBet(userId: string, amount: number): { ok: boolean; text?: string; balance?: number } {
  if (!Number.isInteger(amount) || amount < TAI_XIU_MIN_BET) {
    return {
      ok: false,
      text: `⚠️ Cược tối thiểu là ${formatCoins(TAI_XIU_MIN_BET)} xu.`,
    };
  }

  const sqlite = getSqliteDb();
  const account = ensureAccount(userId);
  if (account.balance < amount) {
    return {
      ok: false,
      text: [
        `💸 Không đủ xu để cược ${formatCoins(amount)}.`,
        `💰 Số dư hiện tại: ${formatCoins(account.balance)} xu.`,
        'Gợi ý: dùng !daily để nhận thêm 1,000 xu mỗi ngày.',
      ].join('\n'),
    };
  }

  sqlite
    .query(
      `
      UPDATE game_accounts
      SET balance = balance - ?, updated_at = ?
      WHERE user_id = ?
    `,
    )
    .run(amount, Date.now(), userId);

  return { ok: true, balance: getBalance(userId) };
}

function rollDice3(): [number, number, number] {
  const one = Math.floor(Math.random() * 6) + 1;
  const two = Math.floor(Math.random() * 6) + 1;
  const three = Math.floor(Math.random() * 6) + 1;
  return [one, two, three];
}

function settleBet(userId: string, amount: number, userSide: DiceSide) {
  const sqlite = getSqliteDb();
  const dice = rollDice3();
  const total = dice[0] + dice[1] + dice[2];
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
  const resultSide: DiceSide = total >= 11 ? 'tai' : 'xiu';
  const userWin = !isTriple && resultSide === userSide;

  let payout = 0;
  if (userWin) {
    payout = Math.floor(amount * TAI_XIU_PAYOUT_MULTIPLIER);
    sqlite
      .query(
        `
        UPDATE game_accounts
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `,
      )
      .run(payout, Date.now(), userId);
  }

  const balance = getBalance(userId);
  const net = userWin ? payout - amount : -amount;

  return {
    dice,
    total,
    isTriple,
    resultSide,
    userWin,
    payout,
    balance,
    net,
  };
}

function buildGameListText(): string {
  return [
    '🎮 Danh sách minigame hiện có',
    '',
    '1. Tài xỉu',
    '• Bắt đầu: !game taixiu',
    '• Cược: !game taixiu cuoc <so_xu> <tai|xiu>',
    '• Luật: !luatchoitaixiu',
    '',
    '💰 Lệnh ví xu:',
    '• !sodu  → xem số dư',
    `• !daily → nhận ${formatCoins(DAILY_REWARD)} xu/ngày`,
  ].join('\n');
}

function buildTaiXiuGuideText(): string {
  return [
    '🎲 Tài xỉu đã sẵn sàng.',
    '',
    'Cách chơi nhanh:',
    `• Cược tối thiểu: ${formatCoins(TAI_XIU_MIN_BET)} xu`,
    '• Cú pháp: !game taixiu cuoc <so_xu> <tai|xiu>',
    '• Ví dụ: !game taixiu cuoc 100 xiu',
    '',
    'Lệnh hỗ trợ:',
    '• !luatchoitaixiu',
    '• !sodu',
    '• !daily',
  ].join('\n');
}

function buildTaiXiuRuleText(): string {
  return [
    '📜 Luật chơi Tài xỉu',
    '',
    '1. Dùng 3 xúc xắc, tổng điểm từ 3 đến 18.',
    '2. Xỉu: tổng 4-10 | Tài: tổng 11-17.',
    '3. Bộ ba (ví dụ 1-1-1, 6-6-6): nhà cái ăn.',
    `4. Cược tối thiểu: ${formatCoins(TAI_XIU_MIN_BET)} xu.`,
    '5. Khi đặt cược, xu bị trừ ngay để giữ cược.',
    `6. Nếu thắng, nhận thưởng theo hệ số ${TAI_XIU_PAYOUT_MULTIPLIER}x (đã gồm tiền gốc).`,
    '7. Nếu thua, mất toàn bộ số xu đã cược.',
  ].join('\n');
}

async function sendGameMessage(api: any, threadId: string, text: string): Promise<void> {
  await sendTextMessage(api, text, threadId, {
    parseMarkdown: false,
    sendMediaImages: false,
    sendCodeFiles: false,
    sendLinks: false,
    source: 'minigame',
  });
}

function parseTaixiuBet(args: string[]): { ok: true; amount: number; side: DiceSide } | { ok: false; text: string } {
  if (args.length < 4) {
    return {
      ok: false,
      text: '⚠️ Cú pháp đúng: !game taixiu cuoc <so_xu> <tai|xiu>',
    };
  }

  const action = normalize(args[1]);
  if (action !== 'cuoc' && action !== 'bet') {
    return {
      ok: false,
      text: '⚠️ Để cược, dùng: !game taixiu cuoc <so_xu> <tai|xiu>',
    };
  }

  const amount = Number(args[2]);
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return { ok: false, text: '⚠️ Số xu cược phải là số nguyên.' };
  }

  const side = normalizeSide(args[3]);
  if (!side) {
    return { ok: false, text: '⚠️ Cửa cược chỉ có: tai hoặc xiu.' };
  }

  return { ok: true, amount, side };
}

function buildSettledText(params: {
  senderName: string;
  amount: number;
  userSide: DiceSide;
  dice: [number, number, number];
  total: number;
  resultSide: DiceSide;
  isTriple: boolean;
  userWin: boolean;
  payout: number;
  net: number;
  balance: number;
}): string {
  const {
    senderName,
    amount,
    userSide,
    dice,
    total,
    resultSide,
    isTriple,
    userWin,
    payout,
    net,
    balance,
  } = params;

  const diceText = `${dice[0]} - ${dice[1]} - ${dice[2]}`;
  const headline = `🎲 Kết quả: ${diceText} (tổng ${total} → ${sideLabel(resultSide)})`;

  if (isTriple) {
    return [
      headline,
      '🏦 Ra bộ ba nên nhà cái ăn.',
      `❌ ${senderName} thua ${formatCoins(amount)} xu ở cửa ${sideLabel(userSide)}.`,
      `💰 Số dư còn lại: ${formatCoins(balance)} xu.`,
    ].join('\n');
  }

  if (userWin) {
    return [
      headline,
      `✅ ${senderName} thắng cửa ${sideLabel(userSide)}.`,
      `💵 Nhận: ${formatCoins(payout)} xu | Lãi ròng: +${formatCoins(net)} xu.`,
      `💰 Số dư hiện tại: ${formatCoins(balance)} xu.`,
    ].join('\n');
  }

  return [
    headline,
    `❌ ${senderName} thua ${formatCoins(amount)} xu ở cửa ${sideLabel(userSide)}.`,
    `💰 Số dư còn lại: ${formatCoins(balance)} xu.`,
  ].join('\n');
}

export async function processMinigameCommand(context: MinigameContext): Promise<MinigameResult> {
  const { api, threadId, text, senderId } = context;
  const senderName = context.senderName?.trim() || 'Người chơi';
  const parsed = parseInput(text);

  if (!parsed.hasBang || !parsed.command) {
    return { handled: false, responseTexts: [] };
  }

  const responses: string[] = [];

  try {
    if (parsed.command === 'daily') {
      const daily = claimDaily(senderId);
      await sendGameMessage(api, threadId, daily.text);
      responses.push(daily.text);
      return { handled: true, responseTexts: responses };
    }

    if (parsed.command === 'sodu' || parsed.command === 'balance') {
      const balance = getBalance(senderId);
      const textOut = `💰 Số dư của ${senderName}: ${formatCoins(balance)} xu.`;
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    if (parsed.command === 'luatchoitaixiu' || parsed.command === 'luattaixiu') {
      const textOut = buildTaiXiuRuleText();
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    if (parsed.command !== 'game' && parsed.command !== 'games') {
      return { handled: false, responseTexts: [] };
    }

    if (parsed.args.length === 0) {
      const textOut = buildGameListText();
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    const gameName = normalize(parsed.args[0]);
    if (gameName !== 'taixiu' && gameName !== 'tx') {
      const textOut = `🎮 Hiện chỉ có game Tài xỉu. Gõ !game để xem danh sách.`;
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    if (parsed.args.length === 1) {
      const textOut = buildTaiXiuGuideText();
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    const betParsed = parseTaixiuBet(parsed.args);
    if (!betParsed.ok) {
      await sendGameMessage(api, threadId, betParsed.text);
      responses.push(betParsed.text);
      return { handled: true, responseTexts: responses };
    }

    const { amount, side } = betParsed;
    if (pendingTaiXiu.has(senderId)) {
      const textOut = '⏳ Bạn đang có 1 ván Tài xỉu đang lắc. Chờ kết quả rồi cược tiếp nhé.';
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    const reserved = reserveBet(senderId, amount);
    if (!reserved.ok) {
      const textOut = reserved.text ?? '⚠️ Không thể đặt cược lúc này.';
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
      return { handled: true, responseTexts: responses };
    }

    pendingTaiXiu.add(senderId);

    const rollingText = [
      `🎲 ${senderName} đã cược ${formatCoins(amount)} xu cửa ${sideLabel(side)}.`,
      `🤖 Bot đang lắc xúc xắc... chờ ${TAI_XIU_WAIT_MS / 1000}s.`,
      `💰 Số dư tạm thời: ${formatCoins(reserved.balance ?? 0)} xu.`,
    ].join('\n');

    await sendGameMessage(api, threadId, rollingText);
    responses.push(rollingText);

    try {
      await delay(TAI_XIU_WAIT_MS);
      const settled = settleBet(senderId, amount, side);
      const resultText = buildSettledText({
        senderName,
        amount,
        userSide: side,
        dice: settled.dice,
        total: settled.total,
        resultSide: settled.resultSide,
        isTriple: settled.isTriple,
        userWin: settled.userWin,
        payout: settled.payout,
        net: settled.net,
        balance: settled.balance,
      });
      await sendGameMessage(api, threadId, resultText);
      responses.push(resultText);
    } finally {
      pendingTaiXiu.delete(senderId);
    }

    return { handled: true, responseTexts: responses };
  } catch (error) {
    pendingTaiXiu.delete(senderId);
    logError('processMinigameCommand', error as Error);
    const textOut = '❌ Lỗi xử lý minigame, thử lại sau giúp mình.';
    try {
      await sendGameMessage(api, threadId, textOut);
      responses.push(textOut);
    } catch {}
    return { handled: true, responseTexts: responses };
  } finally {
    debugLog('MINIGAME', `Processed command for ${senderId}`);
  }
}
