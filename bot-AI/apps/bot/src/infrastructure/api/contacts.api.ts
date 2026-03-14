/**
 * Contacts API - Lấy danh sách bạn bè (contacts) của bot
 * Dùng cho Dashboard để hiển thị tên người dùng trong lịch sử hội thoại
 */
import { Hono } from 'hono';
import { container, Services } from '../../core/index.js';

export const contactsApi = new Hono();

export type ContactBasicInfo = {
  userId: string;
  displayName: string;
  avatar: string;
};

// Cache 10 phút (friends list ít thay đổi, API nặng)
let contactsCache: {
  data: ContactBasicInfo[];
  fetchedAt: number;
} | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

function isValidCache(): boolean {
  return !!contactsCache && Date.now() - contactsCache.fetchedAt < CACHE_TTL_MS;
}

export function bustContactsCache() {
  contactsCache = null;
}

// GET /contacts - Lấy danh sách bạn bè
contactsApi.get('/', async (c) => {
  try {
    const api = container.get<any>(Services.ZALO_API);
    if (!api) {
      return c.json({ success: false, error: 'Zalo API chưa sẵn sàng.' }, 503);
    }

    if (isValidCache()) {
      return c.json({ success: true, data: contactsCache!.data, cached: true });
    }

    const friends = await api.getAllFriends();

    if (!friends || !Array.isArray(friends)) {
      return c.json({ success: true, data: [], cached: false });
    }

    const data: ContactBasicInfo[] = friends.map((f: any) => ({
      userId: f.userId ?? f.uid ?? '',
      displayName: f.displayName || f.zaloName || f.name || `User ${String(f.userId ?? '').slice(-6)}`,
      avatar: f.avatar || f.avt || '',
    })).filter((f: ContactBasicInfo) => !!f.userId);

    contactsCache = { data, fetchedAt: Date.now() };

    return c.json({ success: true, data, cached: false });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// POST /contacts/refresh - Bust cache
contactsApi.post('/refresh', async (c) => {
  bustContactsCache();
  return c.json({ success: true, message: 'Cache cleared' });
});
