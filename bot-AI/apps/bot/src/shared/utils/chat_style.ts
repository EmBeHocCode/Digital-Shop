/**
 * Chat style utilities:
 * - Normalize Vietnamese slang safely
 * - Detect language and lightweight intent hints
 * - Build style hints for LLM prompt (used by both Zalo + Web chat)
 * - Runtime reply stylizer helpers (optional post-processing)
 */

export type SupportedLanguage = 'vi' | 'en' | 'zh';
export type SearchIntent =
  | 'official_site'
  | 'resource_docs'
  | 'how_to'
  | 'definition'
  | 'compare'
  | 'time_holiday'
  | 'general_info';

export type Mood = 'agree' | 'confused' | 'happy' | 'supportive' | 'playful';
export type ChatStyleName = 'normal' | 'genz_soft' | 'genz_bestie' | 'genz_hype' | 'flirty_light';

export interface SourceResult {
  title?: string;
  url?: string;
  content?: string;
  snippet?: string;
  [key: string]: unknown;
}

export interface NormalizeSlangOptions {
  /**
   * Aggressive mode enables context-risky token replacements.
   * Default: false (safe mode for production prompts).
   */
  aggressive?: boolean;
}

export interface ChatStyle {
  name: ChatStyleName;
  prefixes: string[];
  suffixes: string[];
  fillers: string[];
  emojis: string[];
  replaceMap: Record<string, string>;
  maxEmoji: number;
  maxFillers: number;
  lowercaseBias: number;
  punctuationSoftening: boolean;
  allowedForTechnical: boolean;
}

// ---------------------------------------------------------------------------
// Language detection + tokenization
// ---------------------------------------------------------------------------

const VI_REGEX =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/iu;
const ZH_REGEX = /[\u4e00-\u9fff]/u;
const WORD_RE = /[a-zA-Z]+/g;

const VI_WORDS = new Set([
  'chao',
  'xin',
  'toi',
  'ban',
  'minh',
  'em',
  'anh',
  'chi',
  'khong',
  'ko',
  'hok',
  'dc',
  'duoc',
  'nay',
  'mai',
  'hom',
  'gi',
  'sao',
  'nhu',
  'vay',
  'nhe',
  'nha',
  'roi',
  'lam',
  'voi',
  'tieng',
  'viet',
  'cam',
  'on',
  'cung',
  'dang',
  'muon',
  'can',
  'giup',
  'chat',
]);

const EN_WORDS = new Set([
  'the',
  'and',
  'you',
  'your',
  'what',
  'how',
  'help',
  'thanks',
  'welcome',
  'today',
  'please',
  'sure',
  'happy',
  'question',
  'answer',
  'about',
  'with',
  'this',
  'that',
  'there',
]);

// ---------------------------------------------------------------------------
// Slang normalization
// ---------------------------------------------------------------------------

/**
 * SAFE map: only replacements with low ambiguity.
 * Avoid risky tokens like: m, z, gi, tui (unless phrase-level context is explicit).
 */
export const SAFE_SLANG_MAP: Record<string, string> = {
  // pronouns / common chat shorthands
  e: 'em',
  a: 'anh',
  ad: 'anh',
  mik: 'mình',
  mk: 'mình',

  // negation / acknowledgement
  ko: 'không',
  k: 'không',
  kh: 'không',
  hok: 'không',
  k0: 'không',
  hong: 'không',
  'hông': 'không',
  hem: 'không',
  'hẻm': 'không',
  khum: 'không',
  hum: 'không',
  um: 'ừm',
  uk: 'ừ',
  oke: 'ok',
  okie: 'ok',
  oki: 'ok',

  // verbs / utility words
  dc: 'được',
  'đc': 'được',
  'đx': 'được',
  'đk': 'được',
  bt: 'biết',
  bik: 'biết',
  biet: 'biết',
  thik: 'thích',
  thjk: 'thích',
  thw: 'thôi',
  thoi: 'thôi',
  'đg': 'đang',
  dg: 'đang',
  lm: 'làm',
  lmsao: 'làm sao',
  msao: 'mà sao',
  saoz: 'sao vậy',
  saozz: 'sao vậy',
  j: 'gì',
  cj: 'cái gì',
  zay: 'vậy',
  'zậy': 'vậy',
  vs: 'với',
  nx: 'nữa',
  nha: 'nhé',
  nhe: 'nhé',
  ntn: 'như thế nào',
  kq: 'kết quả',

  // time
  hn: 'hôm nay',
  hnay: 'hôm nay',
  hqua: 'hôm qua',
  'bữa': 'hôm trước',
  'mốt': 'ngày mốt',
  t2: 'thứ hai',
  t3: 'thứ ba',
  t4: 'thứ tư',
  t5: 'thứ năm',
  t6: 'thứ sáu',
  t7: 'thứ bảy',
  cn: 'chủ nhật',

  // relationship
  iu: 'yêu',
  iuiu: 'yêu',
  yeu: 'yêu',
  cr: 'crush',
  ny: 'người yêu',
  ngiu: 'người yêu',
  ck: 'chồng',
  vk: 'vợ',

  // emphasis / tone softeners
  vl: 'rất',
  vcl: 'rất',
  'vãi': 'rất',
  'xịn': 'rất xịn',
  xink: 'xinh',
  xinkiu: 'xinh yêu',
  cute: 'dễ thương',
  cutee: 'dễ thương',
  slay: 'đỉnh',
  flex: 'khoe',
  chill: 'thư giãn',

  // chat actions
  rep: 'trả lời',
  ib: 'nhắn tin',
  inb: 'nhắn tin',
  add: 'thêm',
  acc: 'tài khoản',
  stk: 'số tài khoản',
  sdt: 'số điện thoại',
  addr: 'địa chỉ',
  'đth': 'điện thoại',
  tl: 'trả lời',
  trl: 'trả lời',
  ibme: 'nhắn em',
  ping: 'nhắc',
  tag: 'gắn thẻ',

  // emotional
  huhu: 'buồn quá',
  hic: 'buồn',
  huuhuu: 'buồn quá',
  'chánnn': 'chán',
  'mệtt': 'mệt',
  'mệttt': 'mệt',
  xỉuuu: 'xỉu',
  troi: 'trời',
  troii: 'trời',
  omg: 'trời ơi',
  wtf: 'gì vậy',

  // confirmation
  kk: 'ok',
  kkk: 'ok',
  kkkk: 'ok',
  okechua: 'ok chưa',
  okchua: 'ok chưa',
  okelaaa: 'ok',
  yes: 'đúng rồi',

  // technical actions
  check: 'kiểm tra',
  checkkk: 'kiểm tra',
  fix: 'sửa',
  fixx: 'sửa',
  update: 'cập nhật',
  upd: 'cập nhật',
  log: 'ghi log',
  bug: 'lỗi',
  lag: 'chậm',
  load: 'tải',

  // social
  fb: 'facebook',
  ig: 'instagram',
  yt: 'youtube',
  pass: 'mật khẩu',

  // meme / trend
  bestie: 'bạn thân',
  cringe: 'khó xử',
  toxic: 'tiêu cực',
  drama: 'rắc rối',
};

/**
 * Aggressive map: context-risky replacements. Disabled by default.
 * Keep separate to avoid accidental semantic changes in technical prompts.
 */
export const AGGRESSIVE_SLANG_MAP: Record<string, string> = {
  m: 'mày',
  z: 'vậy',
  v: 'vậy',
  gi: 'gì',
  tui: 'em',
};

/**
 * Backward compatibility: existing code may import SLANG_MAP.
 * This union keeps old surface area while normalizeSlang defaults to SAFE mode.
 */
export const SLANG_MAP: Record<string, string> = {
  ...SAFE_SLANG_MAP,
  ...AGGRESSIVE_SLANG_MAP,
};

export const SLANG_PHRASES: Array<[RegExp, string]> = [
  [/\bđz\b/giu, 'đúng rồi'],
  [/\bđr\b/giu, 'đúng rồi'],
  [/\bđúng v\b/giu, 'đúng vậy'],
  [/\bđỉnh v\b/giu, 'đỉnh vậy'],
  [/\bảo z\b/giu, 'ảo vậy'],
  [/\bxỉu up xỉu down\b/giu, 'rụng tim luôn'],
  [/\b=+\)+/gu, ' :)) '],
  [/\btr oi\b/giu, 'trời ơi'],
  [/\bs v\b/giu, 'sao vậy'],
  [/\bgi v\b/giu, 'gì vậy'],
  [/\bhông có\b/giu, 'không có'],
  [/\bko có\b/giu, 'không có'],
  [/\bkh có\b/giu, 'không có'],
  [/\bđc k\b/giu, 'được không'],
  [/\bđc ko\b/giu, 'được không'],
  [/\bntn\b/giu, 'như thế nào'],
  [/\bctay\b/giu, 'chia tay'],
  [/\bcrush ơi\b/giu, 'crush ơi'],
  // phrase-level safe replacements for risky tokens
  [/\btui ơi\b/giu, 'em ơi'],
  [/\bzậy\b/giu, 'vậy'],
];

export const CONFUSED_RE = new RegExp(
  '(không\\s*hiểu|chưa\\s*hiểu|giải\\s*thích|nói\\s*lại|là\\s*sao|sao\\s*vậy|hả|gì\\s*vậy|what|again|\\?\\?)',
  'iu',
);
export const SMALL_TALK_RE = /\b(hi|hello|hey|chào|chao|alo|em ơi|anh ơi|chị ơi|bro|yo|test)\b/iu;
export const INFO_CUE_RE = new RegExp(
  '(là gì|là sao|bao nhiêu|giá|tại sao|vì sao|cách|hướng dẫn|so sánh|review|top|best|what is|how to|why|compare|price|tutorial|guide|explain|define|\\?)',
  'iu',
);
export const QUICK_REPLY_RE =
  /^(ok(ay)?|oke|okie|oki|kk+|haha+|hihi+|hehe+|lol+|ừ+|uh+|hmm+|hm+|k+)$/iu;
export const EMOTIONAL_RE =
  /(buồn|mệt|stress|chán|cô\s*đơn|muốn\s*khóc|trầm\s*cảm|áp\s*lực|tệ\s*quá|nản|mệt\s*mỏi|đau\s*lòng|tuyệt\s*vọng|huhu|hic)/iu;
export const MUSIC_QUERY_RE = /(nhạc|bài\s*hát|ca\s*sĩ|lyrics|album|playlist)/iu;
export const QUERY_FILLER_RE =
  /(em\s*ơi|anh\s*ơi|chị\s*ơi|giúp|giup|được\s*không|được\s*ko|dc\s*ko|dc\s*k|nha|nhé|nè|với|đi|thử|xem|cho|làm\s*ơn|please)/iu;
export const VAGUE_SEARCH_RE =
  /(search\s*lại|tra\s*lại|tìm\s*lại|search\s*đi|tra\s*đi|tìm\s*đi|search\s*xem|xem\s*lại|tìm\s*giúp|search\s*xem)/iu;
export const DATE_RE = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/u;
export const DETAIL_RE =
  /(chi\s*tiết|giải\s*thích\s*kỹ|giải\s*thích\s*rõ|liệt\s*kê|phân\s*tích|viết\s*dài|cụ\s*thể|từng\s*bước|step\s*by\s*step|detailed|explain\s*in\s*detail)/iu;

export const QUICK_ACK_REPLIES = ['Ừm nè anh.', 'Oke anh nè.', 'Em nghe đây.'] as const;

export const CSKH_PHRASES_RE = new RegExp(
  '(cảm ơn anh đã tin tưởng|em sẽ cố gắng không làm anh thất vọng|sẵn sàng hỗ trợ|tôi rất vui|thưa|dạ vâng ạ|xin hân hạnh|trân trọng|quý khách)',
  'iu',
);
export const REFUSAL_RE = new RegExp(
  "(tôi không thể|không thể trả lời|tôi là AI|tôi là một AI|I cannot|I can't|I'm unable|I am unable|As an AI|I don't have the ability|ngoài khả năng|vượt quá khả năng|khả năng xử lý)",
  'iu',
);

export const REFUSAL_FALLBACKS = [
  'Ừa anh nhắn lại rõ hơn chút đi, em hiểu ý anh rồi nhưng muốn chắc chắn ạ.',
  'Hơi thiếu thông tin, anh cho em biết thêm được không?',
  'Em chưa nắm được ý anh lắm, nói thêm đi nha.',
  'Cho em biết anh muốn hỏi về cái gì đi, em sẽ cố đó 🥺',
] as const;

const TOKEN_KEEP_PUNCT_RE = /\s+|\S+/gu;
const URL_LIKE_RE = /^(https?:\/\/|www\.)/iu;
const EMAIL_LIKE_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
const WORD_ONLY_RE = /^[0-9A-Za-zÀ-ỹ]+$/u;
const WORD_PREFIX_RE = /^([0-9A-Za-zÀ-ỹ]+)([^\s0-9A-Za-zÀ-ỹ]+)$/u;
const WORD_SUFFIX_RE = /^([^\s0-9A-Za-zÀ-ỹ]+)([0-9A-Za-zÀ-ỹ]+)$/u;

function shrinkRepeatedChars(token: string): string {
  // "vlllll" -> "vll", "đẹpppp" -> "đẹp"
  return token.replace(/(.)\1{2,}/gu, '$1$1');
}

function normalizeWord(word: string, aggressive: boolean): string {
  const reduced = shrinkRepeatedChars(word);
  const key = reduced.toLowerCase();
  if (SAFE_SLANG_MAP[key]) return SAFE_SLANG_MAP[key];
  if (aggressive && AGGRESSIVE_SLANG_MAP[key]) return AGGRESSIVE_SLANG_MAP[key];
  return reduced;
}

/**
 * Normalize Vietnamese slang with safe-by-default behavior.
 */
export function normalizeSlang(text: string, options: NormalizeSlangOptions = {}): string {
  if (!text) return text;

  const aggressive = Boolean(options.aggressive);
  let normalized = text;

  // 1) Phrase-level replacements first
  for (const [pattern, replacement] of SLANG_PHRASES) {
    normalized = normalized.replace(pattern, replacement);
  }

  // 2) Token-level replacements while preserving punctuation and links
  const parts = normalized.match(TOKEN_KEEP_PUNCT_RE) ?? [];
  const output: string[] = [];

  for (const part of parts) {
    if (/^\s+$/u.test(part)) {
      output.push(part);
      continue;
    }

    if (URL_LIKE_RE.test(part) || EMAIL_LIKE_RE.test(part)) {
      output.push(part);
      continue;
    }

    if (WORD_ONLY_RE.test(part)) {
      output.push(normalizeWord(part, aggressive));
      continue;
    }

    let match = part.match(WORD_PREFIX_RE);
    if (match) {
      output.push(`${normalizeWord(match[1], aggressive)}${match[2]}`);
      continue;
    }

    match = part.match(WORD_SUFFIX_RE);
    if (match) {
      output.push(`${match[1]}${normalizeWord(match[2], aggressive)}`);
      continue;
    }

    output.push(part);
  }

  return output.join('').trim();
}

// ---------------------------------------------------------------------------
// Language / tone helpers
// ---------------------------------------------------------------------------

export function detectLanguage(text: string): SupportedLanguage {
  if (containsChinese(text)) return 'zh';
  if (containsVietnamese(text)) return 'vi';
  if (isProbablyVietnamese(text)) return 'vi';
  return 'en';
}

export function containsVietnamese(text: string): boolean {
  return VI_REGEX.test(text);
}

export function containsChinese(text: string): boolean {
  return ZH_REGEX.test(text);
}

function tokenizeAlpha(text: string): string[] {
  return (text.match(WORD_RE) ?? []).map((t) => t.toLowerCase());
}

export function isProbablyVietnamese(text: string): boolean {
  const tokens = tokenizeAlpha(text);
  if (!tokens.length) return false;

  let score = 0;
  for (const token of tokens) {
    if (VI_WORDS.has(token)) score += 1;
  }

  if (score >= 2) return true;
  if (tokens.includes('tieng') && tokens.includes('viet')) return true;
  if (tokens.includes('xin') && tokens.includes('chao')) return true;
  return false;
}

export function isProbablyEnglish(text: string): boolean {
  const tokens = tokenizeAlpha(text);
  if (!tokens.length) return false;

  let score = 0;
  for (const token of tokens) {
    if (EN_WORDS.has(token)) score += 1;
  }

  return score >= 2;
}

export function hasWeirdMixedVi(text: string): boolean {
  const lower = text.toLowerCase();
  if (/[a-zA-Z]+\.[a-zA-Z]+/u.test(lower)) return true;
  if (/\b(listen|welcome|today|sure|happy|please|help)\b/iu.test(lower)) return true;
  return false;
}

export function isGoodbye(text: string): boolean {
  return /\b(tạm\s*biệt|bye|goodbye|see\s*you|chào\s*tạm\s*biệt|hẹn\s*gặp)\b/iu.test(
    text.toLowerCase(),
  );
}

export function hasFarewell(text: string): boolean {
  return isGoodbye(text);
}

export function isConfusedText(text: string): boolean {
  return CONFUSED_RE.test(text);
}

export function isSmallTalkText(text: string): boolean {
  return SMALL_TALK_RE.test(text);
}

export function hasInfoCue(text: string): boolean {
  return INFO_CUE_RE.test(text);
}

export function isQuickReplyText(text: string): boolean {
  return QUICK_REPLY_RE.test(text.trim());
}

export function isEmotionalText(text: string): boolean {
  return EMOTIONAL_RE.test(text);
}

export function isMusicQuery(text: string): boolean {
  return MUSIC_QUERY_RE.test(text);
}

export function wantsDetail(text: string): boolean {
  return DETAIL_RE.test(text);
}

export function pickQuickAckReply(seed?: number): string {
  const rng = createSeededRandom(seed);
  const idx = Math.floor(rng() * QUICK_ACK_REPLIES.length);
  return QUICK_ACK_REPLIES[idx];
}

// ---------------------------------------------------------------------------
// Search intent + source filtering (kept for compatibility/utility)
// ---------------------------------------------------------------------------

const SEARCH_TOKEN_RE = /[0-9A-Za-zÀ-ỹ]+/gu;

export const SEARCH_STOPWORDS = new Set([
  'em',
  'anh',
  'chi',
  'chị',
  'giup',
  'giúp',
  'cho',
  'voi',
  'với',
  'nha',
  'nhé',
  'nhe',
  'di',
  'đi',
  'dum',
  'dùm',
  'tim',
  'tìm',
  'search',
  'tra',
  'cứu',
  'cuu',
  'google',
  'bing',
  'web',
  'website',
  'site',
  'link',
  'trang',
  'chu',
  'chủ',
  'homepage',
  'official',
  'dia',
  'địa',
  'chi',
  'chỉ',
  'tai',
  'tài',
  'lieu',
  'liệu',
  'pdf',
  'doc',
  'docs',
  'documentation',
  'huong',
  'hướng',
  'dan',
  'dẫn',
  'giao',
  'giáo',
  'trinh',
  'trình',
  'reference',
  'resource',
  'tutorial',
  'guide',
  'course',
  'ebook',
]);

export const TOPIC_STOPWORDS = new Set([
  ...Array.from(SEARCH_STOPWORDS),
  'la',
  'là',
  'gi',
  'gì',
  'cach',
  'cách',
  'huong',
  'hướng',
  'dan',
  'dẫn',
  'so',
  'sánh',
  'vs',
  'versus',
  'compare',
  'official',
  'chinh',
  'chính',
  'thuc',
  'thức',
  'homepage',
]);

const OFFICIAL_SITE_RE = new RegExp(
  '(link|website|web|trang\\s*chủ|trang\\s*chu|site|địa\\s*chỉ|dia\\s*chi|official|homepage|trường|truong|đại\\s*học|dai\\s*hoc)',
  'iu',
);
const RESOURCE_DOCS_RE = new RegExp(
  '(tài\\s*liệu|tai\\s*lieu|pdf|doc|docs|giáo\\s*trình|giao\\s*trinh|ebook|reference|resource|tutorial|guide|course|hướng\\s*dẫn|huong\\s*dan)',
  'iu',
);
const HOW_TO_RE = /(cách|hướng\s*dẫn|tutorial|how\s*to)/iu;
const DEFINITION_RE = /(là\s*gì|what\s*is|define)/iu;
const COMPARE_RE = /(so\s*sánh|\bvs\b|compare)/iu;
const TIME_HOLIDAY_RE = /(ngày\s*lễ|âm\s*lịch|mùng|rằm|tết|giờ\s*mấy)/iu;

const DOC_BOOST_WORDS = [
  'pdf',
  'doc',
  'docx',
  'tài liệu',
  'tai lieu',
  'giáo trình',
  'giao trinh',
  'guide',
  'tutorial',
  'course',
  'ebook',
];
const OFFICIAL_DOMAIN_SUFFIXES = ['.edu.vn', '.gov.vn', '.org', '.edu', '.gov'];
const DEEP_PATH_HINTS = ['/track', '/watch', '/video', '/audio', '/song', '/shorts', '/playlist'];
const MUSIC_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'open.spotify.com',
  'soundcloud.com',
  'zingmp3.vn',
  'nhaccuatui.com',
  'tiktok.com',
];

function tokenizeSearch(text: string): string[] {
  const matches = text.match(SEARCH_TOKEN_RE) ?? [];
  return matches.map((t) => t.toLowerCase());
}

export function classifySearchIntent(userText: string): SearchIntent {
  if (OFFICIAL_SITE_RE.test(userText)) return 'official_site';
  if (RESOURCE_DOCS_RE.test(userText)) return 'resource_docs';
  if (HOW_TO_RE.test(userText)) return 'how_to';
  if (DEFINITION_RE.test(userText)) return 'definition';
  if (COMPARE_RE.test(userText)) return 'compare';
  if (TIME_HOLIDAY_RE.test(userText)) return 'time_holiday';
  return 'general_info';
}

function domainFromUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return '';
  }
}

export function isMusicDomain(url: string): boolean {
  const domain = domainFromUrl(url);
  return MUSIC_DOMAINS.some((d) => domain.includes(d));
}

function homepageScore(url: string): number {
  try {
    const path = (new URL(url).pathname || '').toLowerCase();
    const parts = path.split('/').filter(Boolean);
    let score = parts.length === 0 ? 2 : parts.length === 1 ? 1 : 0;
    if (DEEP_PATH_HINTS.some((hint) => path.includes(hint))) score -= 2;
    return score;
  } catch {
    return 0;
  }
}

function officialDomainBoost(domain: string): number {
  if (!domain) return 0;
  if (OFFICIAL_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))) return 3;
  if (domain.includes('edu') || domain.includes('gov') || domain.includes('org')) return 1;
  return 0;
}

export function filterSources(
  query: string,
  sources: SourceResult[],
  intent: SearchIntent,
  allowMusic: boolean = false,
): SourceResult[] {
  if (!sources.length) return [];

  const qTokens = tokenizeSearch(query).filter((t) => !SEARCH_STOPWORDS.has(t) && t.length >= 2);
  const dropMusic = !allowMusic;

  if (intent === 'official_site') {
    const scored: Array<{ score: number; home: number; domainLen: number; source: SourceResult }> =
      [];

    for (const source of sources) {
      const url = String(source.url || '').trim();
      if (dropMusic && isMusicDomain(url)) continue;

      const title = String(source.title || '');
      const snippet = String(source.content || source.snippet || '');
      const hay = `${title} ${snippet}`.toLowerCase();
      const domain = domainFromUrl(url);
      const matchCount = qTokens.filter((t) => hay.includes(t)).length;
      const domainMatch = qTokens.some((t) => t.length >= 3 && domain.includes(t));

      if (qTokens.length && !(matchCount >= 1 || domainMatch)) continue;

      const score =
        matchCount +
        (domainMatch ? 2 : 0) +
        officialDomainBoost(domain) +
        (domain && domain.length <= 20 ? 1 : 0);

      scored.push({
        score,
        home: homepageScore(url),
        domainLen: -domain.length,
        source,
      });
    }

    scored.sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : b.home !== a.home
          ? b.home - a.home
          : b.domainLen - a.domainLen,
    );

    const seen = new Set<string>();
    const output: SourceResult[] = [];
    for (const item of scored) {
      const domain = domainFromUrl(String(item.source.url || ''));
      if (seen.has(domain)) continue;
      seen.add(domain);
      output.push(item.source);
      if (output.length >= 3) break;
    }

    return output;
  }

  if (intent === 'resource_docs') {
    const scored: Array<{ score: number; source: SourceResult }> = [];

    for (const source of sources) {
      const url = String(source.url || '').trim();
      if (dropMusic && isMusicDomain(url)) continue;

      const title = String(source.title || '');
      const snippet = String(source.content || source.snippet || '');
      const hay = `${title} ${snippet} ${url}`.toLowerCase();
      const matchCount = qTokens.filter((t) => hay.includes(t)).length;
      const boost = DOC_BOOST_WORDS.filter((w) => hay.includes(w)).length;
      const score = matchCount + boost;

      if (score < 1) continue;
      scored.push({ score, source });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((s) => s.source);
  }

  const output: SourceResult[] = [];
  for (const source of sources) {
    const url = String(source.url || '').trim();
    if (dropMusic && isMusicDomain(url)) continue;

    const title = String(source.title || '');
    const snippet = String(source.content || source.snippet || '');
    const hay = `${title} ${snippet}`.toLowerCase().trim();
    const domain = domainFromUrl(url);
    const matchCount = qTokens.filter((t) => hay.includes(t)).length;
    const domainMatch = qTokens.some((t) => t.length >= 3 && domain.includes(t));

    if (qTokens.length && !(matchCount || domainMatch) && hay.length < 20) continue;

    output.push(source);
    if (output.length >= 5) break;
  }

  return output;
}

export function formatSourcesForPrompt(results: SourceResult[]): string {
  return results
    .map((result, index) => {
      const title = String(result.title || 'Untitled').trim();
      const url = String(result.url || '').trim();
      const snippet = String(result.content || result.snippet || '').trim();
      return `[${index + 1}] ${title}\nURL: ${url}\nSnippet: ${snippet}`;
    })
    .join('\n\n')
    .trim();
}

export function formatSourcesForUser(results: SourceResult[]): string {
  return results
    .map((result, index) => {
      const title = String(result.title || 'Untitled').trim();
      const url = String(result.url || '').trim();
      return `[${index + 1}] ${title} - ${url}`;
    })
    .join('\n')
    .trim();
}

export function splitText(text: string, maxLen: number = 3500): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;
  const softMin = Math.floor(maxLen / 2);

  while (remaining.length > maxLen) {
    const window = remaining.slice(0, maxLen);
    let splitAt = -1;

    const paraIdx = window.lastIndexOf('\n\n');
    if (paraIdx >= softMin) splitAt = paraIdx + 2;

    if (splitAt < 0) {
      const punctMatches = [...window.matchAll(/[.!?](?:\s|$)/g)];
      const punctEnd = punctMatches.length ? punctMatches[punctMatches.length - 1].index ?? -1 : -1;
      if (punctEnd >= softMin) splitAt = punctEnd + 1;
    }

    if (splitAt < 0) {
      const wsIdx = window.lastIndexOf(' ');
      if (wsIdx >= softMin) splitAt = wsIdx + 1;
    }

    if (splitAt <= 0) splitAt = maxLen;

    const rawChunk = remaining.slice(0, splitAt);
    const trimmedRaw = rawChunk.trimEnd();
    const unfinishedBullet = /(?:^|\n)\s*[-*•]\s*$/u.test(trimmedRaw);
    const badTail = trimmedRaw.length > 0 && /[-(|/\\:]$/.test(trimmedRaw);

    if (unfinishedBullet || badTail || /-\s$/u.test(rawChunk)) {
      const backStart = Math.max(0, splitAt - 50);
      const region = remaining.slice(backStart, splitAt);
      for (let i = region.length - 1; i >= 0; i--) {
        const ch = region[i];
        if (/\s|[.!?]/u.test(ch)) {
          const candidate = backStart + i + 1;
          if (candidate > 0 && candidate < splitAt) {
            splitAt = candidate;
          }
          break;
        }
      }
    }

    let chunk = remaining.slice(0, splitAt).trimEnd();
    if (!chunk) {
      chunk = remaining.slice(0, maxLen);
      splitAt = chunk.length;
    }

    chunks.push(chunk);
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

// ---------------------------------------------------------------------------
// Chat style / persona system
// ---------------------------------------------------------------------------

const TECHNICAL_KEYWORDS_RE =
  /(lỗi|bug|fix|code|api|webhook|github|server|database|deploy|python|java|javascript|typescript|sql|docker|trace|stack|tsc|build|compile)/iu;
const SAD_VIBE_RE = /(buồn|mệt|chán|stress|huhu|tệ quá|nản|cô đơn|muốn khóc|đau lòng)/iu;
const BESTIE_VIBE_RE = /(bestie|slay|đỉnh|cháy|cuốn|quá đã|xịn|đỉnh chóp)/iu;
const FLIRTY_VIBE_RE = /(đáng yêu|yêu|nhớ|thương|iu|crush|tim tim|cưng)/iu;
const SERIOUS_QUESTION_RE =
  /(hướng dẫn|quy trình|chi tiết|phân tích|từng bước|cấu hình|setup|cài đặt|triển khai)/iu;
const FORMAL_TONE_RE = /(kính gửi|trân trọng|quý khách|xin vui lòng|dear|regards)/iu;
const STEP_BY_STEP_RE = /(bước\s*1|step\s*1|\n\s*\d+\.|\n\s*[-*])/iu;
const CODE_OR_LOG_RE = /```|`[^`]+`|https?:\/\/|www\.|\b[A-Z_]{3,}\b|\bException\b|\bError:\b/iu;

const CHAT_STYLES: Record<ChatStyleName, ChatStyle> = {
  normal: {
    name: 'normal',
    prefixes: ['Em nghĩ vậy nè:', 'Em tóm tắt nhanh nè:', 'Theo em:'],
    suffixes: ['Nếu cần em nói kỹ hơn.', 'Anh/chị muốn em đi từng bước không?'],
    fillers: ['nè', 'nhé'],
    emojis: ['🙂'],
    replaceMap: {
      'xin vui lòng': 'vui lòng',
      'được rồi': 'ok',
      'không thể': 'chưa thể',
      'mình': 'em',
      'bạn': 'anh/chị',
      'cậu': 'anh/chị',
      'tôi': 'em',
    },
    maxEmoji: 1,
    maxFillers: 1,
    lowercaseBias: 0.05,
    punctuationSoftening: true,
    allowedForTechnical: true,
  },
  genz_soft: {
    name: 'genz_soft',
    prefixes: ['Ừm để em nói gọn nè:', 'Nè anh, kiểu này nhé:', 'Oke anh, em chốt nhanh:'],
    suffixes: ['Nếu anh muốn em nói kỹ hơn em tách bước nha.', 'Anh cần em ví dụ luôn không?'],
    fillers: ['nè', 'nha', 'ha'],
    emojis: ['🙂', '✨', '🫶'],
    replaceMap: {
      'được rồi': 'ok',
      'không': 'không',
      'rất': 'khá',
      'mình': 'em',
      'bạn': 'anh/chị',
      'cậu': 'anh/chị',
      'tôi': 'em',
    },
    maxEmoji: 2,
    maxFillers: 1,
    lowercaseBias: 0.2,
    punctuationSoftening: true,
    allowedForTechnical: true,
  },
  genz_bestie: {
    name: 'genz_bestie',
    prefixes: ['Bestie ơi nghe nè:', 'Nè nè, chốt nhẹ:', 'Ê cái này ổn nè:'],
    suffixes: ['Ổn áp luôn.', 'Vậy là mượt rồi đó.'],
    fillers: ['nè', 'í', 'thật ra'],
    emojis: ['😌', '✨', '🫶', '😉'],
    replaceMap: {
      'rất tốt': 'ổn áp',
      'đúng rồi': 'chuẩn luôn',
      'hợp lý': 'hợp vibe',
      'mình': 'em',
      'bạn': 'anh/chị',
      'cậu': 'anh/chị',
      'tôi': 'em',
    },
    maxEmoji: 2,
    maxFillers: 2,
    lowercaseBias: 0.35,
    punctuationSoftening: true,
    allowedForTechnical: false,
  },
  genz_hype: {
    name: 'genz_hype',
    prefixes: ['Ui cái này cháy nè:', 'Đỉnh á, chốt nhanh:', 'Quá cuốn luôn, kiểu này:'],
    suffixes: ['Vào việc được luôn.', 'Triển liền được nha.'],
    fillers: ['kiểu', 'nè'],
    emojis: ['🔥', '⚡', '✨', '😎'],
    replaceMap: {
      'rất nổi': 'siêu nổi',
      tốt: 'xịn',
      đúng: 'chuẩn',
      'mình': 'em',
      'bạn': 'anh/chị',
      'cậu': 'anh/chị',
      'tôi': 'em',
    },
    maxEmoji: 2,
    maxFillers: 1,
    lowercaseBias: 0.4,
    punctuationSoftening: true,
    allowedForTechnical: false,
  },
  flirty_light: {
    name: 'flirty_light',
    prefixes: ['Ơ dễ thương ghê, nghe nè:', 'Nói nhẹ thôi nha:', 'Em trả lời nè:'],
    suffixes: ['Thế là ổn rồi đó 🤍', 'Vậy nha, đừng căng quá.'],
    fillers: ['nha', 'nè'],
    emojis: ['🤍', '✨', '😊'],
    replaceMap: {
      'được': 'ok',
      'đồng ý': 'chốt',
      'rất': 'khá',
      'mình': 'em',
      'bạn': 'anh/chị',
      'cậu': 'anh/chị',
      'tôi': 'em',
    },
    maxEmoji: 2,
    maxFillers: 1,
    lowercaseBias: 0.3,
    punctuationSoftening: true,
    allowedForTechnical: false,
  },
};

export const REACTION_TEMPLATES: Record<Mood, string[]> = {
  agree: ['Chuẩn nè,', 'Ừ đúng đó,', 'Ok luôn,'],
  confused: ['Để em nói lại gọn nha,', 'Khoan, em chốt lại ý nè,', 'Ừ để rõ hơn thì,'],
  happy: ['Nice đó,', 'Ê vui nè,', 'Quá ổn luôn,'],
  supportive: ['Em hiểu mà,', 'Không sao đâu,', 'Anh/chị cứ bình tĩnh chút nha,'],
  playful: ['Hehe nghe nè,', 'Ê ê nè,', 'Okie,'],
};

/** Return all supported chat styles. */
export function getChatStyles(): Record<string, ChatStyle> {
  return CHAT_STYLES;
}

/** Pick style from user text context. */
export function pickStyle(userText: string, defaultStyle: ChatStyleName = 'genz_soft'): ChatStyleName {
  const normalized = normalizeSlang(userText);

  if (TECHNICAL_KEYWORDS_RE.test(normalized) || SERIOUS_QUESTION_RE.test(normalized)) {
    return 'normal';
  }

  if (SAD_VIBE_RE.test(normalized)) {
    return 'genz_soft';
  }

  if (FLIRTY_VIBE_RE.test(normalized) && !TECHNICAL_KEYWORDS_RE.test(normalized)) {
    return 'flirty_light';
  }

  if (BESTIE_VIBE_RE.test(normalized)) {
    if (/(cháy|đỉnh|slay)/iu.test(normalized)) return 'genz_hype';
    return 'genz_bestie';
  }

  return CHAT_STYLES[defaultStyle] ? defaultStyle : 'genz_soft';
}

/** Guard: reduce style when content should stay clean / technical / long-form. */
export function shouldReduceStyle(text: string): boolean {
  if (!text) return false;

  if (text.length > 220) return true;
  if (TECHNICAL_KEYWORDS_RE.test(text)) return true;
  if (SERIOUS_QUESTION_RE.test(text)) return true;
  if (STEP_BY_STEP_RE.test(text)) return true;
  if (CODE_OR_LOG_RE.test(text)) return true;
  if (FORMAL_TONE_RE.test(text)) return true;

  return false;
}

function createSeededRandom(seed?: number): () => number {
  if (seed == null || Number.isNaN(seed)) return Math.random;

  let state = (Math.floor(seed) >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickFrom<T>(arr: T[], rng: () => number): T | null {
  if (!arr.length) return null;
  const idx = Math.floor(rng() * arr.length);
  return arr[idx] ?? null;
}

function hasCodeOrUrl(text: string): boolean {
  return CODE_OR_LOG_RE.test(text);
}

function softenPunctuation(text: string): string {
  return text
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .replace(/\. {2,}/g, '. ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

/**
 * Enforce bot addressing tone:
 * - bot self-pronoun: em
 * - user address: anh/chị
 *
 * Keep this conservative to avoid breaking technical/code-like text.
 */
function enforceAddressingTone(text: string): string {
  if (!text) return text;
  if (/```/u.test(text)) return text;

  return text
    .replace(/\b(Mình|mình|Tôi|tôi)\b(?=\s+(sẽ|đã|đang|nghĩ|thấy|khuyên|gợi|có|muốn|xin|cảm|không|chưa|vừa|cần|đi))/gu, (m) =>
      /^[MT]/u.test(m) ? 'Em' : 'em',
    )
    .replace(/\b(Bạn|bạn|Cậu|cậu)\b(?=\s+(có|muốn|nên|hãy|cần|đang|thử|giúp|xem|nhớ|gửi|check|kiểm|làm|đọc|dùng|bị|vừa|được|sẽ|đã|nhắn))/gu, (m) =>
      /^[BC]/u.test(m) ? 'Anh/chị' : 'anh/chị',
    );
}

/**
 * Safe word replacement that preserves spacing/punctuation and avoids URL/email corruption.
 */
export function _safeReplaceWords(text: string, mapping: Record<string, string>): string {
  if (!text || !Object.keys(mapping).length) return text;

  const parts = text.match(TOKEN_KEEP_PUNCT_RE) ?? [];
  const out: string[] = [];

  for (const part of parts) {
    if (/^\s+$/u.test(part)) {
      out.push(part);
      continue;
    }

    if (URL_LIKE_RE.test(part) || EMAIL_LIKE_RE.test(part)) {
      out.push(part);
      continue;
    }

    const replaceWord = (word: string): string => {
      const key = word.toLowerCase();
      return mapping[key] ?? word;
    };

    if (WORD_ONLY_RE.test(part)) {
      out.push(replaceWord(part));
      continue;
    }

    let match = part.match(WORD_PREFIX_RE);
    if (match) {
      out.push(`${replaceWord(match[1])}${match[2]}`);
      continue;
    }

    match = part.match(WORD_SUFFIX_RE);
    if (match) {
      out.push(`${match[1]}${replaceWord(match[2])}`);
      continue;
    }

    out.push(part);
  }

  return out.join('');
}

function maybeLowercaseStart(text: string, bias: number, rng: () => number): string {
  if (!text || bias <= 0 || rng() >= bias) return text;
  const first = text.charAt(0);
  return `${first.toLowerCase()}${text.slice(1)}`;
}

function addDecorators(text: string, style: ChatStyle, reduce: boolean, rng: () => number): string {
  let output = text;

  if (!reduce && output.length < 220 && !hasCodeOrUrl(output)) {
    if (style.prefixes.length && rng() < 0.28) {
      const prefix = pickFrom(style.prefixes, rng);
      if (prefix) output = `${prefix} ${output}`;
    }

    const fillerCount = style.maxFillers > 0 && style.fillers.length > 0 && rng() < 0.35 ? 1 : 0;
    for (let i = 0; i < fillerCount; i++) {
      const filler = pickFrom(style.fillers, rng);
      if (!filler) continue;
      if (!output.toLowerCase().includes(filler.toLowerCase())) {
        output = `${filler}, ${output}`;
      }
    }

    if (style.suffixes.length && rng() < 0.3) {
      const suffix = pickFrom(style.suffixes, rng);
      if (suffix) output = `${output} ${suffix}`;
    }
  }

  const canEmoji = !reduce && !hasCodeOrUrl(output) && style.maxEmoji > 0 && style.emojis.length > 0;
  if (canEmoji && rng() < 0.35) {
    const count = Math.min(style.maxEmoji, 1 + Math.floor(rng() * style.maxEmoji));
    const pool = [...style.emojis];
    const chosen: string[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(rng() * pool.length);
      const [emoji] = pool.splice(idx, 1);
      if (emoji) chosen.push(emoji);
    }
    if (chosen.length) output = `${output} ${chosen.join(' ')}`;
  }

  return output;
}

/**
 * Stylize base reply with selected persona.
 * - keeps readability
 * - avoids heavy emoji/filler spam
 * - deterministic when seed is provided
 */
export function stylizeReply(text: string, styleName: ChatStyleName = 'normal', seed?: number): string {
  const base = (text || '').trim();
  if (!base) return text;

  const rng = createSeededRandom(seed);
  const style = CHAT_STYLES[styleName] ?? CHAT_STYLES.normal;
  const reduce = shouldReduceStyle(base) || (!style.allowedForTechnical && TECHNICAL_KEYWORDS_RE.test(base));
  const effective = reduce ? CHAT_STYLES.normal : style;

  let output = _safeReplaceWords(base, effective.replaceMap);

  if (effective.punctuationSoftening) {
    output = softenPunctuation(output);
  }

  output = maybeLowercaseStart(output, effective.lowercaseBias, rng);
  output = addDecorators(output, effective, reduce, rng);
  output = enforceAddressingTone(output);
  output = output.replace(/\s{2,}/g, ' ').trim();

  return output || base;
}

/** Infer lightweight mood from user text. */
export function inferMood(userText: string): Mood | undefined {
  const normalized = normalizeSlang(userText || '');
  if (!normalized) return undefined;

  if (SAD_VIBE_RE.test(normalized)) return 'supportive';
  if (CONFUSED_RE.test(normalized)) return 'confused';
  if (/(haha|hihi|vui|đỉnh|cháy|slay)/iu.test(normalized)) return 'happy';
  if (FLIRTY_VIBE_RE.test(normalized)) return 'playful';
  if (QUICK_REPLY_RE.test(normalized.trim())) return 'agree';

  return undefined;
}

/** Add a small natural reaction phrase before the reply body. */
export function addReaction(text: string, mood?: Mood, seed?: number): string {
  if (!text) return text;
  if (!mood || !REACTION_TEMPLATES[mood]) return text;

  const rng = createSeededRandom(seed);
  const picked = pickFrom(REACTION_TEMPLATES[mood], rng);
  if (!picked) return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  if (trimmed.toLowerCase().startsWith(picked.toLowerCase())) return trimmed;
  return `${picked} ${trimmed}`;
}

/**
 * Build final reply from base model output + style guard.
 * Flow:
 * 1) normalize slang on user text
 * 2) pick style + infer mood
 * 3) reduce style when base reply is technical/long/formal
 * 4) add reaction then stylize
 */
export function buildReply(
  userText: string,
  baseReply: string,
  defaultStyle: ChatStyleName = 'genz_soft',
  seed?: number,
): string {
  const base = (baseReply || '').trim();
  if (!base) return baseReply;

  const normalizedUser = normalizeSlang(userText || '');
  let style = pickStyle(normalizedUser, defaultStyle);
  const mood = inferMood(normalizedUser);

  const reduce = shouldReduceStyle(base);

  // Style guard: serious/technical replies stay clean.
  if (reduce || TECHNICAL_KEYWORDS_RE.test(normalizedUser) || SERIOUS_QUESTION_RE.test(normalizedUser)) {
    style = 'normal';
  }

  // Guard: avoid flirty style for serious ask.
  if (
    style === 'flirty_light' &&
    (TECHNICAL_KEYWORDS_RE.test(normalizedUser) || SERIOUS_QUESTION_RE.test(normalizedUser))
  ) {
    style = 'genz_soft';
  }

  const reacted = reduce ? base : addReaction(base, mood, seed == null ? undefined : seed + 1);
  return stylizeReply(reacted, style, seed == null ? undefined : seed + 2);
}

// ---------------------------------------------------------------------------
// Prompt hint builder (consumed by both Zalo + Web chat pipelines)
// ---------------------------------------------------------------------------

export function buildChatStyleHint(rawText: string): string {
  const text = (rawText || '').trim();
  if (!text) return '';

  const normalized = normalizeSlang(text);
  const style = pickStyle(normalized, 'genz_soft');
  const mood = inferMood(normalized);

  const hintLines: string[] = [];

  hintLines.push('Ưu tiên trả lời tự nhiên kiểu chat đời thường, ngắn gọn 1-3 câu.');
  hintLines.push('Mặc định ưu tiên 1-2 câu; chỉ trả lời dài khi user yêu cầu chi tiết.');
  hintLines.push('Xưng hô cố định: bot xưng "em", gọi user là "anh/chị".');
  hintLines.push('Không dùng văn phong CSKH/tổng đài.');
  hintLines.push('Tránh các cụm máy móc như: "Cảm ơn anh/chị đã liên hệ", "Xin vui lòng", "Rất hân hạnh hỗ trợ".');
  hintLines.push('Không dùng đại từ "mình/bạn/cậu" để xưng hô trong phản hồi.');
  hintLines.push('Có thể hiểu viết tắt/gen Z nhưng phản hồi phải rõ nghĩa, không lố.');
  hintLines.push(`Style đề xuất: ${style}.`);
  if (mood) hintLines.push(`Mood gợi ý: ${mood}.`);

  if (normalized && normalized !== text) {
    hintLines.push(`User viết tắt/slang; hiểu theo nghĩa: "${normalized}".`);
  }

  if (isQuickReplyText(normalized)) {
    hintLines.push('Đây là tin nhắn ngắn/cảm thán. Trả lời cực ngắn, thân thiện.');
  } else if (isSmallTalkText(normalized)) {
    hintLines.push('Đây là small-talk/chào hỏi. Trả lời 1 câu tự nhiên, không lan man.');
  }

  if (isConfusedText(normalized)) {
    hintLines.push('User đang chưa hiểu. Giải thích lại thật ngắn, dễ hiểu, đúng trọng tâm.');
  }

  if (isEmotionalText(normalized)) {
    hintLines.push('User mang cảm xúc. Ưu tiên giọng ấm áp, đồng cảm, không giáo điều.');
  }

  if (TECHNICAL_KEYWORDS_RE.test(normalized) || wantsDetail(normalized)) {
    hintLines.push('Đây là ngữ cảnh kỹ thuật. Giữ câu sạch, rõ, hạn chế emoji/filler.');
  } else {
    hintLines.push('Có thể dùng từ đệm/emoji nhẹ, tránh cringe hoặc lố.');
  }

  if (!wantsDetail(normalized) && !hasInfoCue(normalized)) {
    hintLines.push('Không tự mở rộng quá nhiều thông tin nếu user chưa yêu cầu.');
  }

  return hintLines.join('\n');
}

// ---------------------------------------------------------------------------
// Snake_case aliases (compatibility with prompt conventions)
// ---------------------------------------------------------------------------

export const detect_language = detectLanguage;
export const normalize_slang = normalizeSlang;
export const contains_vietnamese = containsVietnamese;
export const contains_chinese = containsChinese;
export const is_probably_vietnamese = isProbablyVietnamese;
export const is_probably_english = isProbablyEnglish;
export const has_weird_mixed_vi = hasWeirdMixedVi;
export const is_goodbye = isGoodbye;
export const has_farewell = hasFarewell;
export const classify_search_intent = classifySearchIntent;
export const filter_sources = filterSources;
export const split_text = splitText;
export const get_chat_styles = getChatStyles;
export const pick_style = pickStyle;
export const should_reduce_style = shouldReduceStyle;
export const _safe_replace_words = _safeReplaceWords;
export const stylize_reply = stylizeReply;
export const add_reaction = addReaction;
export const infer_mood = inferMood;
export const build_reply = buildReply;

// ---------------------------------------------------------------------------
// Demo examples (quick sanity reference)
// ---------------------------------------------------------------------------

/**
 * Demo:
 * user: "a ơi bot e bị lag v, fix s nè"
 * base: "Anh kiểm tra lại log server, tốc độ mạng và đoạn xử lý webhook trước nhé."
 * => expected: normal or genz_soft nhẹ, không spam emoji.
 *
 * user: "huhu nay em mệt quá"
 * base: "Em nghỉ ngơi một chút rồi làm tiếp nhé."
 * => expected: genz_soft + supportive vibe.
 *
 * user: "bestie ơi cái này cháy quá"
 * base: "Đúng rồi, cái này đang rất nổi."
 * => expected: genz_bestie hoặc genz_hype.
 */
