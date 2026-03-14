/**
 * Env API - Quản lý file .env từ web dashboard
 * Đọc/ghi keys, preserve comments và format gốc
 */
import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const envPath = path.join(projectRoot, '.env');

// Keys nhạy cảm - hiển thị masked
const SENSITIVE_KEYS = ['ZALO_CREDENTIALS_BASE64', 'ZALO_CREDENTIALS_JSON'];

// Keys quan trọng được nhóm để hiển thị trên UI
export const ENV_KEY_GROUPS = [
  {
    group: 'Gemini API Keys',
    description: 'Hỗ trợ nhiều key, tự động xoay vòng khi rate limit',
    keys: [
      'GEMINI_API_KEY_1', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3',
      'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'GEMINI_API_KEY_6',
      'GEMINI_API_KEY_7', 'GEMINI_API_KEY_8', 'GEMINI_API_KEY_9', 'GEMINI_API_KEY_10',
    ],
  },
  {
    group: 'AI & Services',
    description: 'Các dịch vụ AI và tính năng bổ sung',
    keys: ['GROQ_API_KEY', 'ELEVENLABS_API_KEY', 'FREEPIK_API_KEY', 'E2B_API_KEY'],
  },
  {
    group: 'Search & Media',
    description: 'Tìm kiếm Google, YouTube, Giphy',
    keys: ['GOOGLE_SEARCH_API_KEY', 'GOOGLE_SEARCH_CX', 'YOUTUBE_API_KEY', 'GIPHY_API_KEY'],
  },
  {
    group: 'Cloud & Backup',
    description: 'GitHub Gist để backup dữ liệu',
    keys: ['GITHUB_GIST_TOKEN', 'GITHUB_GIST_ID'],
  },
  {
    group: 'System',
    description: 'Cấu hình hệ thống',
    keys: ['API_KEY', 'LOG_RECEIVER_ID'],
  },
];

// Parse .env file → object (giữ nguyên tất cả keys)
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// Ghi lại .env, update giá trị trong khi giữ nguyên comments và structure
function writeEnvFile(updates: Record<string, string>): void {
  let content = fs.readFileSync(envPath, 'utf-8');

  for (const [key, value] of Object.entries(updates)) {
    // Regex tìm dòng KEY=... (không phải comment)
    const regex = new RegExp(`^(${key}=)(.*)$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}`);
    } else {
      // Key chưa có trong file → append vào cuối
      content = content.trimEnd() + `\n${key}=${value}\n`;
    }
  }

  fs.writeFileSync(envPath, content, 'utf-8');
}

// Mask value để tránh lộ key trong response
function maskValue(key: string, value: string): string {
  if (!value || value.startsWith('your_') || value === '') return value;
  if (SENSITIVE_KEYS.includes(key)) return '***HIDDEN***';
  if (value.length <= 8) return '****';
  return value.slice(0, 6) + '...' + value.slice(-4);
}

export const envApi = new Hono();

// GET /env - Trả về tất cả keys với value masked + groups
envApi.get('/', (c) => {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const all = parseEnvFile(content);

    // Build grouped response
    const groups = ENV_KEY_GROUPS.map((group) => ({
      ...group,
      items: group.keys.map((key) => {
        const raw = all[key] ?? '';
        const isEmpty = !raw || raw.startsWith('your_') || raw === '';
        return {
          key,
          masked: maskValue(key, raw),
          isEmpty,
          isSet: !isEmpty,
        };
      }),
    }));

    return c.json({ success: true, data: { groups } });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /env/raw/:key - Lấy raw value của 1 key (để điền vào input khi edit)
envApi.get('/raw/:key', (c) => {
  try {
    const key = c.req.param('key');
    if (SENSITIVE_KEYS.includes(key)) {
      return c.json({ success: false, error: 'Key này không thể đọc trực tiếp' }, 403);
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const all = parseEnvFile(content);
    const value = all[key] ?? '';
    return c.json({ success: true, data: { key, value } });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// ─── API Key Validation ──────────────────────────────────────────────────────

type KeyStatus = 'valid' | 'invalid' | 'missing' | 'error';
interface CacheEntry { status: KeyStatus; message?: string; checkedAt: number; }
const validationCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

type Validator = (key: string, extra: Record<string, string>) => Promise<{ status: KeyStatus; message?: string }>;

const API_KEY_VALIDATORS: Record<string, Validator> = {
  GROQ_API_KEY: async (key) => {
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) return { status: 'valid' };
    if (r.status === 401) return { status: 'invalid', message: 'API Key không hợp lệ hoặc đã hết hạn' };
    if (r.status === 429) return { status: 'valid', message: 'Rate limit (key hợp lệ)' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  ELEVENLABS_API_KEY: async (key) => {
    const r = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) return { status: 'valid' };
    if (r.status === 401) return { status: 'invalid', message: 'API Key không hợp lệ' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  FREEPIK_API_KEY: async (key) => {
    const r = await fetch('https://api.freepik.com/v1/user', {
      headers: { 'X-Freepik-API-Key': key },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) return { status: 'valid' };
    if (r.status === 401 || r.status === 403) return { status: 'invalid', message: 'API Key không hợp lệ hoặc không đủ quyền' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  GIPHY_API_KEY: async (key) => {
    const r = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(key)}&limit=1`, {
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) return { status: 'valid' };
    if (r.status === 401 || r.status === 403) return { status: 'invalid', message: 'API Key không hợp lệ' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  YOUTUBE_API_KEY: async (key) => {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&q=test&maxResults=1&key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (r.ok) return { status: 'valid' };
    const body = await r.json().catch(() => ({})) as Record<string, unknown>;
    const reason = (body?.error as Record<string, unknown>)?.errors as Array<Record<string, string>> | undefined;
    if (r.status === 403) {
      if (reason?.[0]?.reason === 'quotaExceeded') return { status: 'valid', message: 'Đã hết quota ngày (key hợp lệ)' };
      return { status: 'invalid', message: 'Key bị từ chối hoặc không có quyền' };
    }
    if (r.status === 400) return { status: 'invalid', message: 'API Key không hợp lệ' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  GOOGLE_SEARCH_API_KEY: async (key, extra) => {
    const cx = extra.GOOGLE_SEARCH_CX ?? '';
    if (!cx) return { status: 'error', message: 'Thiếu GOOGLE_SEARCH_CX' };
    const r = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=test&num=1`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (r.ok) return { status: 'valid' };
    if (r.status === 403 || r.status === 400) return { status: 'invalid', message: 'API Key hoặc Search CX không hợp lệ' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },

  E2B_API_KEY: async (key) => {
    const r = await fetch('https://api.e2b.dev/sandboxes', {
      headers: { 'X-API-Key': key },
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok || r.status === 200) return { status: 'valid' };
    if (r.status === 401 || r.status === 403) return { status: 'invalid', message: 'API Key không hợp lệ' };
    return { status: 'error', message: `HTTP ${r.status}` };
  },
};

// GET /env/validate - Kiểm tra tính hợp lệ của các API key quan trọng (cache 5 phút)
// ?force=1 để bypass cache
envApi.get('/validate', async (c) => {
  try {
    const force = c.req.query('force') === '1';
    const content = fs.readFileSync(envPath, 'utf-8');
    const all = parseEnvFile(content);
    const now = Date.now();
    const extra: Record<string, string> = { GOOGLE_SEARCH_CX: all.GOOGLE_SEARCH_CX ?? '' };

    const results: { key: string; status: KeyStatus; message?: string; checkedAt: string }[] = [];

    for (const [keyName, validator] of Object.entries(API_KEY_VALIDATORS)) {
      const rawVal = (all[keyName] ?? '').trim();
      const isEmpty = !rawVal || rawVal.startsWith('your_');

      if (isEmpty) {
        results.push({ key: keyName, status: 'missing', message: 'Chưa cài đặt API Key', checkedAt: new Date().toISOString() });
        continue;
      }

      // Check cache
      if (!force) {
        const cached = validationCache.get(keyName);
        if (cached && now - cached.checkedAt < CACHE_TTL) {
          results.push({ key: keyName, status: cached.status, message: cached.message, checkedAt: new Date(cached.checkedAt).toISOString() });
          continue;
        }
      }

      // Validate
      try {
        const result = await validator(rawVal, extra);
        validationCache.set(keyName, { ...result, checkedAt: now });
        results.push({ key: keyName, ...result, checkedAt: new Date().toISOString() });
      } catch {
        const entry = { status: 'error' as KeyStatus, message: 'Timeout hoặc không thể kết nối', checkedAt: now };
        validationCache.set(keyName, entry);
        results.push({ key: keyName, ...entry, checkedAt: new Date().toISOString() });
      }
    }

    return c.json({ success: true, data: { results } });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /env/gemini-status - Trạng thái key Gemini đang được dùng (live từ keyManager)
envApi.get('/gemini-status', async (c) => {
  try {
    const { keyManager } = await import('../../infrastructure/ai/providers/gemini/keyManager.js');
    const keys = keyManager.getStatus();
    const currentIdx = keyManager.getCurrentKeyIndex(); // 1-based
    const totalKeys = keyManager.getTotalKeys();

    // Tìm next key khả dụng
    const available = keys.filter((k) => k.available);
    const nextKey = available.find((k) => k.index !== currentIdx) ?? null;

    const modelStatus = keyManager.getModelStatus();
    const currentModel = keyManager.getCurrentModelName();

    return c.json({
      success: true,
      data: {
        currentKeyIndex: currentIdx,
        totalKeys,
        nextKeyIndex: nextKey?.index ?? null,
        keys,
        currentModel,
        models: modelStatus,
      },
    });
  } catch {
    return c.json({ success: true, data: null }); // bot chưa init keyManager
  }
});

// PUT /env - Cập nhật 1 hoặc nhiều keys
envApi.put('/', async (c) => {
  try {
    const rawBody = await c.req.json() as Record<string, unknown>;
    if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
      return c.json({ success: false, error: 'Body phải là object { KEY: value }' }, 400);
    }

    // Hỗ trợ cả 2 format:
    // 1) { KEY: "value" } (legacy)
    // 2) { updates: { KEY: "value" } } (web client hiện tại)
    const maybeUpdates = rawBody.updates;
    const updatesSource =
      typeof maybeUpdates === 'object' && maybeUpdates !== null && !Array.isArray(maybeUpdates)
        ? (maybeUpdates as Record<string, unknown>)
        : rawBody;

    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(updatesSource)) {
      updates[key] = typeof value === 'string' ? value : String(value ?? '');
    }

    // Cho phép xóa key bằng cách set value = ""
    writeEnvFile(updates);

    return c.json({
      success: true,
      message: `Đã cập nhật ${Object.keys(updates).length} key(s). Restart bot để áp dụng.`,
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});
