/**
 * Message Listener - Xử lý sự kiện tin nhắn từ Zalo
 * Tách logic từ main.ts để clean hơn
 */

import { CONFIG } from '../../core/config/config.js';
import { debugLog, Events, eventBus, logMessage } from '../../core/index.js';
import { getSqliteDb } from '../../infrastructure/database/connection.js';
import { initThreadHistory, isThreadInitialized } from '../../shared/utils/history/history.js';
import {
  getBotMessageByMsgId,
  getLastBotMessageInThread,
} from '../../shared/utils/message/messageStore.js';
import { abortTask } from '../../shared/utils/taskManager.js';
import { ThreadType } from '../../infrastructure/messaging/zalo/zalo.service.js';
import { isSleepModeBlockingNow } from '../../infrastructure/messaging/zalo/sleepMode.service.js';
import { isBotMentioned } from './classifier.js';
import { isAllowedUser } from './guards/user.filter.js';
import { addToBuffer } from './services/message.buffer.js';
import { isAutoReplyEnabled, setAutoReply } from './services/autoReply.service.js';
import { isAdminUser, parseBangCommand } from '../../shared/utils/access/commandAccess.js';

// FriendEventType from zca-js
const FriendEventType = {
  ADD: 0,
  REMOVE: 1,
  REQUEST: 2,
  UNDO_REQUEST: 3,
  REJECT_REQUEST: 4,
  SEEN_FRIEND_REQUEST: 5,
  BLOCK: 6,
  UNBLOCK: 7,
  BLOCK_CALL: 8,
  UNBLOCK_CALL: 9,
  PIN_UNPIN: 10,
  PIN_CREATE: 11,
  UNKNOWN: 12,
} as const;

export interface MessageListenerOptions {
  isCloudMessage: (message: any) => boolean;
  processCloudMessage: (message: any) => void;
  shouldSkipMessage: (message: any) => { skip: boolean; reason?: string };
}

const FRIEND_CACHE_TTL_MS = 10 * 60 * 1000;
let friendIdsCache: { ids: Set<string>; fetchedAt: number } | null = null;
const confirmedFriendIds = new Set<string>();
const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

interface StrangerAutoReplyStateRow {
  user_id: string;
  last_sent_at: number;
  last_sent_date: string;
  sent_count_today: number;
}

type DirectMessageAutoReplyScope = 'stranger' | 'friend' | 'private';

interface DirectMessageAutoReplyConfigLike {
  enabled?: boolean;
  message?: string;
  cooldownMs?: number;
  dailyLimit?: number;
}

function isFriendCacheValid(): boolean {
  return !!friendIdsCache && Date.now() - friendIdsCache.fetchedAt < FRIEND_CACHE_TTL_MS;
}

async function getFriendIds(api: any): Promise<Set<string> | null> {
  if (isFriendCacheValid()) {
    return friendIdsCache!.ids;
  }

  try {
    const friends = await api.getAllFriends();
    if (!Array.isArray(friends)) return new Set<string>();

    const ids = new Set<string>();
    for (const friend of friends) {
      const id = String(friend?.userId ?? friend?.uid ?? '').trim();
      if (id) ids.add(id);
    }

    friendIdsCache = { ids, fetchedAt: Date.now() };
    return ids;
  } catch (error) {
    debugLog('STRANGER_AUTO_REPLY', `Failed to fetch friends: ${(error as Error).message}`);
    return null;
  }
}

async function isStrangerUser(api: any, userId: string): Promise<boolean> {
  if (userId === CONFIG.adminUserId) return false;
  if (confirmedFriendIds.has(userId)) return false;
  const friendIds = await getFriendIds(api);
  if (!friendIds) return false;
  const isFriend = friendIds.has(userId);
  if (isFriend) {
    confirmedFriendIds.add(userId);
  }
  return !isFriend;
}

function getVnDateKey(timestampMs: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: VN_TIMEZONE }).format(new Date(timestampMs));
}

function normalizeAutoReplyText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildAutoReplyStateKey(scope: DirectMessageAutoReplyScope, userId: string): string {
  return `${scope}:${userId}`;
}

function getDirectMessageAutoReplyState(
  scope: DirectMessageAutoReplyScope,
  userId: string,
): StrangerAutoReplyStateRow | null {
  try {
    const sqlite = getSqliteDb();
    const scopedKey = buildAutoReplyStateKey(scope, userId);
    let row = sqlite
      .query(
        `
        SELECT user_id, last_sent_at, last_sent_date, sent_count_today
        FROM stranger_auto_reply_state
        WHERE user_id = ?
      `,
      )
      .get(scopedKey) as StrangerAutoReplyStateRow | null;

    // Giữ tương thích với dữ liệu cũ chỉ có key theo user_id cho stranger auto-reply.
    if (!row && scope === 'stranger') {
      row = sqlite
        .query(
          `
          SELECT user_id, last_sent_at, last_sent_date, sent_count_today
          FROM stranger_auto_reply_state
          WHERE user_id = ?
        `,
        )
        .get(userId) as StrangerAutoReplyStateRow | null;
    }

    return row;
  } catch (error) {
    debugLog('DM_AUTO_REPLY', `Failed to query auto-reply state for ${scope}:${userId}: ${error}`);
    return null;
  }
}

function markDirectMessageReplySent(
  scope: DirectMessageAutoReplyScope,
  userId: string,
  nowTs: number,
): void {
  const dateKey = getVnDateKey(nowTs);
  const stateKey = buildAutoReplyStateKey(scope, userId);
  const sqlite = getSqliteDb();
  sqlite
    .query(
      `
      INSERT INTO stranger_auto_reply_state
        (user_id, last_sent_at, last_sent_date, sent_count_today, updated_at)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        last_sent_at = excluded.last_sent_at,
        sent_count_today =
          CASE
            WHEN stranger_auto_reply_state.last_sent_date = excluded.last_sent_date
              THEN stranger_auto_reply_state.sent_count_today + 1
            ELSE 1
          END,
        last_sent_date = excluded.last_sent_date,
        updated_at = excluded.updated_at
    `,
    )
    .run(stateKey, nowTs, dateKey, nowTs);
}

function canSendDirectMessageReply(
  scope: DirectMessageAutoReplyScope,
  userId: string,
  cooldownMs: number,
  dailyLimit: number,
): { allowed: boolean; reason: string } {
  const nowTs = Date.now();
  const state = getDirectMessageAutoReplyState(scope, userId);
  if (!state) {
    return { allowed: true, reason: 'first-message' };
  }

  const today = getVnDateKey(nowTs);
  const sentToday = state.last_sent_date === today ? state.sent_count_today : 0;
  if (sentToday >= dailyLimit) {
    return { allowed: false, reason: `daily-limit(${sentToday}/${dailyLimit})` };
  }

  if (nowTs - state.last_sent_at < cooldownMs) {
    const remainMs = cooldownMs - (nowTs - state.last_sent_at);
    return { allowed: false, reason: `cooldown(${remainMs}ms)` };
  }

  return { allowed: true, reason: 'eligible' };
}

function buildDirectMessageReplyMessage(template: string | undefined, senderName: string): string {
  const safeName = senderName?.trim() || 'anh/chị';
  const ownerName = 'anh Hùng';
  const botName = CONFIG.name || 'Meow';

  const resolved = (
    template?.trim() ||
    'Em là bot tự động của anh Hùng. Hiện tại anh có thể đang bận, mong anh/chị chờ một chút ạ.'
  )
    .replaceAll('{{senderName}}', safeName)
    .replaceAll('{{ownerName}}', ownerName)
    .replaceAll('{{botName}}', botName);

  return normalizeAutoReplyText(resolved);
}

async function trySendDirectMessageAutoReply(input: {
  api: any;
  threadId: string;
  senderId: string;
  senderName: string;
  scope: DirectMessageAutoReplyScope;
  config: DirectMessageAutoReplyConfigLike | undefined;
  logLabel: string;
}): Promise<boolean> {
  const { api, threadId, senderId, senderName, scope, config, logLabel } = input;
  if (!config?.enabled) return false;

  const cooldownMs = Math.max(0, config.cooldownMs ?? 600000);
  const dailyLimit = Math.max(1, config.dailyLimit ?? 1);
  const decision = canSendDirectMessageReply(scope, senderId, cooldownMs, dailyLimit);

  if (!decision.allowed) {
    debugLog(
      'DM_AUTO_REPLY',
      `Skip ${scope} auto-reply: ${senderName} (${senderId}), reason=${decision.reason}, cooldown=${cooldownMs}ms, dailyLimit=${dailyLimit}`,
    );
    return true;
  }

  const replyText = buildDirectMessageReplyMessage(config.message, senderName);
  try {
    await api.sendMessage(replyText, threadId, ThreadType.User);
    markDirectMessageReplySent(scope, senderId, Date.now());
    console.log(`[Bot] 🤖 ${logLabel}: "${senderName}" (${senderId})`);
  } catch (error) {
    debugLog(
      'DM_AUTO_REPLY',
      `Failed to send ${scope} auto-reply to ${senderId}: ${(error as Error).message}`,
    );
  }

  return true;
}

function isFriendAcceptedSystemMessage(message: any): boolean {
  const msgType = String(message?.data?.msgType ?? '').toLowerCase();
  const content = message?.data?.content;

  if (msgType === 'chat.ecard') {
    const description = String(content?.description ?? '').toLowerCase();
    return description.includes('đồng ý kết bạn') || description.includes('kết bạn');
  }

  if (msgType === 'webchat' && content?.action === 'msginfo.actionlist') {
    const title = String(content?.title ?? '').toLowerCase();
    return title.includes('đồng ý kết bạn') || title.includes('kết bạn');
  }

  return false;
}

/**
 * Tạo message handler cho Zalo API
 */
export function createMessageHandler(api: any, options: MessageListenerOptions) {
  const { isCloudMessage, processCloudMessage, shouldSkipMessage } = options;

  return async (message: any) => {
    const threadId = message.threadId;

    // Log RAW message
    if (CONFIG.fileLogging) {
      logMessage('IN', threadId, message);
    }

    // Emit message received event
    await eventBus.emit(Events.MESSAGE_RECEIVED, { threadId, message });

    // Kiểm tra Cloud Debug
    const cloudMessage = isCloudMessage(message);
    if (cloudMessage) {
      processCloudMessage(message);
    }

    // ── Lệnh #onbot / #unbot (tự gửi trong nhóm) ────────────────────────────
    if (message.isSelf && message.type === ThreadType.Group) {
      const rawContent = message.data?.content;
      const content = (typeof rawContent === 'string' ? rawContent : '').trim().toLowerCase();
      if (content === '#onbot' || content === '#unbot') {
        await setAutoReply(api, threadId, content === '#onbot');
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Kiểm tra bỏ qua
    const { skip, reason } = shouldSkipMessage(message);
    if (skip && !cloudMessage) {
      debugLog('MSG', `Skipping: ${reason}, thread=${threadId}`);
      return;
    }

    // Sleep mode: ngủ thật -> không xử lý chat/lệnh
    if (isSleepModeBlockingNow()) {
      debugLog('SLEEP_MODE', `Ignoring message during sleep window: thread=${threadId}`);
      return;
    }

    // Kiểm tra user được phép
    const senderId = message.data?.uidFrom || threadId;
    const senderName = message.data?.dName || '';
    const rawContent = message.data?.content;
    const parsedBang =
      typeof rawContent === 'string' ? parseBangCommand(rawContent) : { isCommand: false, rawName: '', normalizedName: '' };
    // Bất kỳ tin nhắn bắt đầu bằng "!" đều đi vào pipeline command access.
    // Tránh trường hợp alias/lệnh mới chưa kịp có trong catalog bị chặn sớm.
    const isQuickCommand = parsedBang.isCommand;
    const isFriendAcceptedEvent = isFriendAcceptedSystemMessage(message);
    if (isFriendAcceptedEvent && senderId) {
      // Đã có tín hiệu kết bạn thành công → dừng auto-reply người lạ ngay lập tức
      confirmedFriendIds.add(String(senderId));
      friendIdsCache = null;
      debugLog('STRANGER_AUTO_REPLY', `Friend accepted event detected for ${senderId}`);
    }

    // Auto-reply DM (chat 1-1) trước khi vào pipeline AI
    if (
      !cloudMessage &&
      !message.isSelf &&
      message.type === ThreadType.User &&
      !isAdminUser(senderId) &&
      !isFriendAcceptedEvent
    ) {
      const stranger = await isStrangerUser(api, senderId);
      const repliedAllPrivate = await trySendDirectMessageAutoReply({
        api,
        threadId,
        senderId,
        senderName,
        scope: 'private',
        config: CONFIG.privateAutoReply,
        logLabel: 'Auto-reply mọi tin nhắn riêng',
      });
      if (repliedAllPrivate) {
        return;
      }

      if (stranger) {
        const repliedStranger = await trySendDirectMessageAutoReply({
          api,
          threadId,
          senderId,
          senderName,
          scope: 'stranger',
          config: CONFIG.strangerAutoReply,
          logLabel: 'Auto-reply người lạ',
        });
        if (repliedStranger) return;
      } else {
        const friendDmReplyEnabled = CONFIG.friendDmReplyEnabled ?? true;
        if (!friendDmReplyEnabled) {
          debugLog('DM_AUTO_REPLY', `Friend DM reply disabled, ignore thread=${threadId}, sender=${senderId}`);
          return;
        }
      }
    }

    if (!cloudMessage && !isQuickCommand && !isAllowedUser(senderId, senderName)) {
      // Nếu tin nhắn từ nhóm đã có trong allowedGroupIds → không cần user filter
      const isGroupMsg = message.type === ThreadType.Group;
      const allowAllGroups = CONFIG.allowAllGroups ?? true;
      const allowedGroups = CONFIG.allowedGroupIds ?? [];
      const groupIsAllowed = isGroupMsg && (allowAllGroups || allowedGroups.includes(threadId));
      if (!groupIsAllowed) {
        console.log(`[Bot] ⏭️ Bỏ qua: "${senderName}" (${senderId})`);
        return;
      }
    }

    // ── Lọc sớm tin nhắn NHÓM ────────────────────────────────────────────────
    if (!cloudMessage && message.type === ThreadType.Group) {
      const autoReplyEnabled = isAutoReplyEnabled(threadId);
      const isAdmin = isAdminUser(senderId);

      // 1. Kiểm tra whitelist nhóm (nếu có cấu hình)
      const allowAllGroups = CONFIG.allowAllGroups ?? true;
      const allowedGroups = CONFIG.allowedGroupIds ?? [];
      if (
        !allowAllGroups &&
        !allowedGroups.includes(threadId) &&
        !autoReplyEnabled &&
        !isQuickCommand &&
        !isAdmin
      ) {
        debugLog('MSG', `Group ${threadId} not in allowedGroupIds, dropped`);
        return; // Nhóm không trong whitelist → bỏ qua toàn bộ
      }
      // 2. Nếu chưa bật auto-reply: vẫn phải được mention mới trả lời
      if (!autoReplyEnabled && !isQuickCommand && !isAdmin) {
        const botId = api.getContext().uid;
        const botName = CONFIG.name || 'Meow';
        if (!isBotMentioned(message, botId, botName)) {
          debugLog('MSG', `Group message ignored early (no mention): ${threadId}`);
          return; // Drop hoàn toàn — không tốn history, không buffer, không AI
        }
      }
      if (isQuickCommand) {
        debugLog('MSG', `Quick command bypass filter in group ${threadId}`);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Khởi tạo history
    const msgType = message.type;
    if (!isThreadInitialized(threadId)) {
      debugLog('MSG', `Initializing history for thread: ${threadId}`);
      await initThreadHistory(api, threadId, msgType);
    }

    // Hủy task đang chạy nếu có
    abortTask(threadId);

    // Thêm vào buffer
    addToBuffer(api, threadId, message);
  };
}

/**
 * Đăng ký message listener cho Zalo API
 */
export function registerMessageListener(api: any, options: MessageListenerOptions): void {
  const handler = createMessageHandler(api, options);
  api.listener.on('message', handler);
  console.log('[Gateway] 📨 Message listener registered');

  // Đăng ký friend event listener để auto-accept realtime
  registerFriendEventListener(api);

  // Đăng ký reaction listener
  registerReactionListener(api);

  // Đăng ký group event listener để lưu sự kiện nhóm vào history
  registerGroupEventListener(api);
}

/**
 * Xử lý friend event realtime (auto-accept kết bạn)
 */
function registerFriendEventListener(api: any): void {
  api.listener.on('friend_event', async (event: any) => {
    debugLog('FRIEND_EVENT', `Received: type=${event.type}, data=${JSON.stringify(event.data)}`);
    // Có friend event là clear cache để lần check kế tiếp luôn lấy danh sách bạn bè mới nhất
    friendIdsCache = null;
    const fromUid = event.data?.fromUid ? String(event.data.fromUid) : '';

    // FRIEND ADD/BLOCK/REMOVE events: cập nhật set bạn bè đã xác nhận
    if (event.type === FriendEventType.ADD && fromUid) {
      confirmedFriendIds.add(fromUid);
    }
    if ((event.type === FriendEventType.REMOVE || event.type === FriendEventType.BLOCK) && fromUid) {
      confirmedFriendIds.delete(fromUid);
    }

    // Chỉ xử lý REQUEST (type = 2)
    if (event.type !== FriendEventType.REQUEST) {
      return;
    }
    const displayName = event.data?.displayName || event.data?.zaloName || 'Người lạ';

    if (!fromUid) {
      debugLog('FRIEND_EVENT', '⚠️ Không tìm thấy fromUid trong friend request');
      return;
    }

    // Nếu là request từ chính mình gửi đi thì bỏ qua
    if (event.isSelf) {
      debugLog('FRIEND_EVENT', 'Bỏ qua: self request');
      return;
    }

    debugLog('FRIEND_EVENT', `💌 Nhận lời mời kết bạn từ: ${displayName} (${fromUid})`);

    try {
      // Delay ngẫu nhiên cho giống người (từ config)
      const minDelay = CONFIG.friendRequest?.autoAcceptDelayMinMs ?? 2000;
      const maxDelay = CONFIG.friendRequest?.autoAcceptDelayMaxMs ?? 5000;
      const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Auto accept
      await api.acceptFriendRequest(fromUid);
      friendIdsCache = null; // clear cache để lần check sau thấy bạn mới
      debugLog('FRIEND_EVENT', `✅ Đã chấp nhận kết bạn: ${displayName}`);
      console.log(`[Bot] ✅ Đã chấp nhận kết bạn: ${displayName} (${fromUid})`);
    } catch (error: any) {
      // Mã lỗi 225 = Đã là bạn bè rồi
      if (error.code === 225 || error.message?.includes('225')) {
        debugLog('FRIEND_EVENT', `ℹ️ Đã là bạn bè với ${displayName}`);
      } else {
        debugLog(
          'FRIEND_EVENT',
          `❌ Lỗi accept ${fromUid}: ${error.message} (code: ${error.code})`,
        );
      }
    }
  });

  console.log('[Gateway] 👥 Friend event listener registered (auto-accept enabled)');
}

// Mapping reaction icons to readable names
const REACTION_NAMES: Record<string, string> = {
  '/-heart': 'tim ❤️',
  '/-strong': 'like 👍',
  '/-weak': 'dislike 👎',
  ':>': 'haha 😆',
  ':o': 'wow 😮',
  ':-((': 'buồn 😢',
  ':-h': 'phẫn nộ 😡',
};

// Track pending reactions để debounce khi user thả nhiều reaction liên tục
// Key: `${threadId}:${reactorId}:${originalMsgId}`, Value: { timeout, icons: string[], processedEventIds: Set }
const pendingReactions = new Map<
  string,
  { timeout: NodeJS.Timeout; icons: string[]; processedEventIds: Set<string> }
>();

/**
 * Xử lý reaction event - tạo fake message để AI tự suy nghĩ phản hồi
 * Có debounce để gom tất cả reactions trong 2s thành danh sách
 */
function registerReactionListener(api: any): void {
  api.listener.on('reaction', async (reactionObj: any) => {
    // Log toàn bộ reaction object để debug
    debugLog('REACTION', `RAW event: ${JSON.stringify(reactionObj)}`);

    const { data, threadId, isSelf } = reactionObj;

    // Bỏ qua reaction của chính bot
    if (isSelf) {
      debugLog('REACTION', 'Ignoring self reaction (isSelf=true)');
      return;
    }

    const reactorId = data?.uidFrom;
    const icon = data?.content?.rIcon;
    // Zalo có thể dùng nhiều loại msgId khác nhau
    const targetMsgId = data?.msgId;
    const oriMsgId = data?.content?.oriMsgId; // Original message ID
    const cliMsgId = data?.content?.cliMsgId; // Client message ID
    const globalMsgId = data?.content?.globalMsgId; // Global message ID
    // rMsg array chứa thông tin tin nhắn gốc được react - ĐÂY LÀ ID CHÍNH XÁC NHẤT
    const rMsgGlobalId = data?.content?.rMsg?.[0]?.gMsgID; // Global msg ID từ rMsg
    const rMsgCliId = data?.content?.rMsg?.[0]?.cMsgID; // Client msg ID từ rMsg

    if (!reactorId || !icon) {
      debugLog('REACTION', 'Missing reactorId or icon in reaction event');
      return;
    }

    // Log tất cả các loại msgId để debug
    debugLog(
      'REACTION',
      `User ${reactorId} reacted ${icon} - msgId=${targetMsgId}, rMsgGlobalId=${rMsgGlobalId}, rMsgCliId=${rMsgCliId}, oriMsgId=${oriMsgId} in ${threadId}`,
    );

    // Thử tìm tin nhắn bot với tất cả các loại ID có thể
    // Ưu tiên rMsgGlobalId vì đây là ID chính xác của tin nhắn được react
    const possibleIds = [rMsgGlobalId, rMsgCliId, targetMsgId, oriMsgId, cliMsgId, globalMsgId]
      .filter((id) => id != null)
      .map((id) => String(id));

    let botMsg = null;
    let matchedId = null;

    for (const id of possibleIds) {
      botMsg = await getBotMessageByMsgId(id);
      if (botMsg) {
        matchedId = id;
        debugLog('REACTION', `Found bot message with ID: ${id}`);
        break;
      }
    }

    // Nếu không tìm thấy theo ID, thử tìm tin nhắn gần nhất của bot trong thread
    if (!botMsg) {
      botMsg = await getLastBotMessageInThread(threadId);
      if (botMsg) {
        debugLog('REACTION', `Found recent bot message in thread: ${botMsg.msgId}`);
      }
    }

    if (!botMsg) {
      debugLog('REACTION', `Not a bot message (tried IDs: ${possibleIds.join(', ')}), ignoring`);
      return;
    }

    // Lấy tên reaction
    const reactionName = REACTION_NAMES[icon] || icon;

    // Key để track reaction: threadId:reactorId:originalMsgId
    const reactionKey = `${threadId}:${reactorId}:${botMsg.msgId}`;
    const pending = pendingReactions.get(reactionKey);

    // Deduplicate: Zalo API có thể gửi nhiều event trùng lặp cho cùng 1 reaction
    // Dùng targetMsgId (msgId của reaction event) để detect duplicate
    const eventId = String(targetMsgId);
    if (pending?.processedEventIds.has(eventId)) {
      debugLog('REACTION', `Duplicate event ignored: ${eventId}`);
      return;
    }

    // Nếu đã có pending reaction cho cùng tin nhắn, clear timeout cũ và thêm icon mới vào danh sách
    if (pending) {
      clearTimeout(pending.timeout);
      pending.icons.push(icon);
      pending.processedEventIds.add(eventId);
      debugLog('REACTION', `User added another reaction: ${icon} (total: ${pending.icons.length})`);
    }

    // Lấy danh sách icons hiện tại hoặc tạo mới
    const icons = pending?.icons || [icon];
    const processedEventIds = pending?.processedEventIds || new Set([eventId]);

    // Debounce: đợi trước khi xử lý để gom tất cả reactions (từ config)
    const reactionDebounceMs = CONFIG.reaction?.debounceMs ?? 2000;
    const newPending = {
      timeout: setTimeout(async () => {
        pendingReactions.delete(reactionKey);

        // Chuyển danh sách icons thành tên reactions (unique)
        const reactionNames = icons.map((i) => REACTION_NAMES[i] || i);
        const uniqueReactions = [...new Set(reactionNames)];

        // Tạo nội dung mô tả reaction để AI hiểu context
        // Nhấn mạnh đây là reaction LÊN TIN NHẮN chứ không phải cảm xúc cá nhân
        let reactionContent: string;
        const msgPreview =
          botMsg.content.substring(0, 150) + (botMsg.content.length > 150 ? '...' : '');

        // Nếu tất cả reactions giống nhau, chỉ hiển thị 1 lần với số lượng
        if (uniqueReactions.length === 1 && icons.length > 1) {
          reactionContent = `[REACTION] Người dùng vừa thả ${icons.length} reaction "${uniqueReactions[0]}" lên tin nhắn của bạn: "${msgPreview}"`;
        } else if (icons.length > 1) {
          // Nhiều loại reaction khác nhau - hiển thị unique list
          reactionContent = `[REACTION] Người dùng vừa thả ${icons.length} reaction lên tin nhắn của bạn: ${uniqueReactions.join(', ')}. Tin nhắn được react: "${msgPreview}"`;
        } else {
          reactionContent = `[REACTION] Người dùng vừa thả reaction "${reactionNames[0]}" lên tin nhắn của bạn: "${msgPreview}"`;
        }

        // Tạo fake message để đẩy vào luồng xử lý chung
        const fakeMessage = {
          type: 'reaction',
          threadId,
          isSelf: false,
          data: {
            uidFrom: reactorId,
            content: reactionContent,
            msgType: 'chat',
            // Metadata để AI biết đây là reaction event
            _isReaction: true,
            _reactionIcons: icons, // Danh sách tất cả icons
            _reactionNames: reactionNames, // Danh sách tên reactions
            _originalMsgContent: botMsg.content,
            _originalMsgId: botMsg.msgId,
          },
        };

        debugLog(
          'REACTION',
          `Processing ${icons.length} reactions after debounce: ${uniqueReactions.join(', ')}`,
        );

        // Đẩy vào buffer để AI xử lý như tin nhắn bình thường
        addToBuffer(api, threadId, fakeMessage);
      }, reactionDebounceMs),
      icons,
      processedEventIds,
    };

    pendingReactions.set(reactionKey, newPending);
    const debounceMs = CONFIG.reaction?.debounceMs ?? 2000;
    debugLog('REACTION', `Queued reaction (will process in ${debounceMs}ms): ${reactionName}`);
  });

  console.log('[Gateway] 💝 Reaction listener registered');
}

// GroupEventType from zca-js
const GroupEventType = {
  JOIN_REQUEST: 'join_request',
  JOIN: 'join',
  LEAVE: 'leave',
  REMOVE_MEMBER: 'remove_member',
  BLOCK_MEMBER: 'block_member',
  UPDATE_SETTING: 'update_setting',
  UPDATE: 'update',
  NEW_LINK: 'new_link',
  ADD_ADMIN: 'add_admin',
  REMOVE_ADMIN: 'remove_admin',
  NEW_PIN_TOPIC: 'new_pin_topic',
  UPDATE_PIN_TOPIC: 'update_pin_topic',
  REORDER_PIN_TOPIC: 'reorder_pin_topic',
  UPDATE_BOARD: 'update_board',
  REMOVE_BOARD: 'remove_board',
  UPDATE_TOPIC: 'update_topic',
  UNPIN_TOPIC: 'unpin_topic',
  REMOVE_TOPIC: 'remove_topic',
  ACCEPT_REMIND: 'accept_remind',
  REJECT_REMIND: 'reject_remind',
  REMIND_TOPIC: 'remind_topic',
  UPDATE_AVATAR: 'update_avatar',
  UNKNOWN: 'unknown',
} as const;

/**
 * Xử lý group event - lưu vào history để AI hiểu context nhóm
 * Các sự kiện như thêm/xóa thành viên, đổi tên nhóm, etc.
 */
export function registerGroupEventListener(api: any): void {
  api.listener.on('group_event', async (event: any) => {
    debugLog('GROUP_EVENT', `RAW event: ${JSON.stringify(event)}`);

    const { type, data, threadId, isSelf } = event;

    // Bỏ qua một số event không cần thiết
    if (
      type === GroupEventType.JOIN_REQUEST ||
      type === GroupEventType.UPDATE_SETTING ||
      type === GroupEventType.UNKNOWN
    ) {
      debugLog('GROUP_EVENT', `Skipping event type: ${type}`);
      return;
    }

    // Tạo mô tả sự kiện để AI hiểu
    let eventDescription = '';
    const actorName = data?.updateMembers?.[0]?.dName || data?.creatorId || 'Ai đó';
    const groupName = data?.groupName || 'nhóm';

    switch (type) {
      case GroupEventType.JOIN: {
        const joinMembers = data?.updateMembers?.map((m: any) => m.dName).join(', ') || actorName;
        eventDescription = `[HỆ THỐNG] ${joinMembers} đã tham gia ${groupName}`;
        break;
      }

      case GroupEventType.LEAVE: {
        const leaveMembers = data?.updateMembers?.map((m: any) => m.dName).join(', ') || actorName;
        eventDescription = `[HỆ THỐNG] ${leaveMembers} đã rời khỏi ${groupName}`;
        break;
      }

      case GroupEventType.REMOVE_MEMBER: {
        const removedMembers =
          data?.updateMembers?.map((m: any) => m.dName).join(', ') || 'Thành viên';
        eventDescription = `[HỆ THỐNG] ${removedMembers} đã bị xóa khỏi ${groupName}`;
        break;
      }

      case GroupEventType.BLOCK_MEMBER: {
        const blockedMembers =
          data?.updateMembers?.map((m: any) => m.dName).join(', ') || 'Thành viên';
        eventDescription = `[HỆ THỐNG] ${blockedMembers} đã bị chặn khỏi ${groupName}`;
        break;
      }

      case GroupEventType.ADD_ADMIN: {
        const newAdmins = data?.updateMembers?.map((m: any) => m.dName).join(', ') || 'Thành viên';
        eventDescription = `[HỆ THỐNG] ${newAdmins} đã được thêm làm quản trị viên ${groupName}`;
        break;
      }

      case GroupEventType.REMOVE_ADMIN: {
        const removedAdmins =
          data?.updateMembers?.map((m: any) => m.dName).join(', ') || 'Thành viên';
        eventDescription = `[HỆ THỐNG] ${removedAdmins} đã bị xóa quyền quản trị viên ${groupName}`;
        break;
      }

      case GroupEventType.UPDATE:
        // Đổi tên nhóm hoặc cập nhật thông tin
        if (data?.groupName) {
          eventDescription = `[HỆ THỐNG] Tên nhóm đã được đổi thành "${data.groupName}"`;
        } else {
          eventDescription = `[HỆ THỐNG] Thông tin nhóm đã được cập nhật`;
        }
        break;

      case GroupEventType.UPDATE_AVATAR:
        eventDescription = `[HỆ THỐNG] Ảnh đại diện nhóm đã được thay đổi`;
        break;

      case GroupEventType.NEW_LINK:
        eventDescription = `[HỆ THỐNG] Link nhóm đã được tạo mới`;
        break;

      case GroupEventType.NEW_PIN_TOPIC:
      case GroupEventType.UPDATE_PIN_TOPIC:
        eventDescription = `[HỆ THỐNG] Một tin nhắn đã được ghim trong nhóm`;
        break;

      case GroupEventType.UNPIN_TOPIC:
        eventDescription = `[HỆ THỐNG] Một tin nhắn đã được bỏ ghim`;
        break;

      default:
        debugLog('GROUP_EVENT', `Unhandled event type: ${type}`);
        return;
    }

    if (!eventDescription) return;

    console.log(`[Bot] 📢 ${eventDescription}`);
    debugLog('GROUP_EVENT', `Event description: ${eventDescription}`);

    // Tạo fake message để lưu vào history
    const fakeMessage = {
      type: 1, // Group type
      threadId,
      isSelf: false,
      data: {
        uidFrom: data?.sourceId || data?.creatorId || 'system',
        dName: 'Hệ thống',
        content: eventDescription,
        msgType: `group.${type}`,
        // Metadata
        _isGroupEvent: true,
        _eventType: type,
        _eventData: data,
      },
    };

    // Khởi tạo history nếu chưa có
    if (!isThreadInitialized(threadId)) {
      debugLog('GROUP_EVENT', `Initializing history for thread: ${threadId}`);
      await initThreadHistory(api, threadId, 1); // 1 = Group
    }

    // Thêm vào buffer để lưu vào history (không cần AI trả lời)
    // Chỉ lưu vào history, không trigger AI response
    const { saveToHistory } = await import('../../shared/utils/history/history.js');
    await saveToHistory(threadId, fakeMessage);
    debugLog('GROUP_EVENT', `Saved group event to history: ${threadId}`);
  });

  console.log('[Gateway] 📢 Group event listener registered');
}
