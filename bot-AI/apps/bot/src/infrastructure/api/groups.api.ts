/**
 * Groups API - Lấy danh sách nhóm Zalo mà bot đang tham gia
 * Dùng cho Dashboard để hiển thị Group Picker
 */
import { Hono } from 'hono';
import { container, Services } from '../../core/index.js';
import { CONFIG } from '../../core/config/config.js';
import { setAutoReply } from '../../modules/gateway/services/autoReply.service.js';

export const groupsApi = new Hono();

// Cache để tránh spam API Zalo
let groupsCache: {
  data: GroupBasicInfo[];
  fetchedAt: number;
} | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

export type GroupBasicInfo = {
  id: string;
  name: string;
  memberCount: number;
  avatar: string;
  isAllowed: boolean;
  isAutoReply: boolean;
};

function isValidCache(): boolean {
  return !!groupsCache && Date.now() - groupsCache.fetchedAt < CACHE_TTL_MS;
}

/** Bust cache khi allowedGroupIds thay đổi */
export function bustGroupsCache() {
  groupsCache = null;
}

// GET /groups - Lấy danh sách nhóm + trạng thái isAllowed
groupsApi.get('/', async (c) => {
  try {
    const api = container.get<any>(Services.ZALO_API);
    if (!api) {
      return c.json({ success: false, error: 'Zalo API chưa sẵn sàng. Bot có thể chưa đăng nhập.' }, 503);
    }

    // Trả về cache nếu còn hạn
    if (isValidCache()) {
      const allowAllGroups = CONFIG.allowAllGroups ?? true;
      const allowedIds = CONFIG.allowedGroupIds ?? [];
      const autoReplyIds = CONFIG.autoReplyGroupIds ?? [];
      const withAllowed = groupsCache!.data.map((g) => ({
        ...g,
        isAllowed: allowAllGroups || allowedIds.includes(g.id),
        isAutoReply: autoReplyIds.includes(g.id),
      }));
      return c.json({ success: true, data: withAllowed, cached: true });
    }

    // 1. Lấy danh sách tất cả group IDs
    const allGroupsResponse = await api.getAllGroups();
    const gridVerMap = allGroupsResponse?.gridVerMap ?? {};
    const groupIds = Object.keys(gridVerMap);

    if (groupIds.length === 0) {
      return c.json({ success: true, data: [], cached: false });
    }

    // 2. Lấy thông tin chi tiết (tên, số thành viên) theo batch tối đa 50
    const BATCH_SIZE = 50;
    const groups: GroupBasicInfo[] = [];

    for (let i = 0; i < groupIds.length; i += BATCH_SIZE) {
      const batch = groupIds.slice(i, i + BATCH_SIZE);
      try {
        const infoResponse = await api.getGroupInfo(batch);
        const gridInfoMap = infoResponse?.gridInfoMap ?? {};

        for (const gid of batch) {
          const info = gridInfoMap[gid];
          if (info) {
            groups.push({
              id: gid,
              name: info.name || `Nhóm ${gid.slice(-6)}`,
              memberCount: info.totalMember ?? (info.memberIds?.length ?? 0),
              avatar: info.fullAvt || info.avt || '',
              isAllowed: false, // sẽ fill sau
              isAutoReply: false, // sẽ fill sau
            });
          }
        }
      } catch (batchErr) {
        console.error(`[GroupsAPI] Lỗi khi lấy batch ${i}–${i + BATCH_SIZE}:`, batchErr);
      }

      // Delay nhỏ giữa các batch để tránh rate limit
      if (i + BATCH_SIZE < groupIds.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Sắp xếp theo tên
    groups.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    // Lưu cache (không có isAllowed — sẽ tính động)
    groupsCache = { data: groups, fetchedAt: Date.now() };

    // 3. Fill isAllowed từ CONFIG hiện tại
    const allowAllGroups = CONFIG.allowAllGroups ?? true;
    const allowedIds = CONFIG.allowedGroupIds ?? [];
    const autoReplyIds = CONFIG.autoReplyGroupIds ?? [];
    const result = groups.map((g) => ({
      ...g,
      isAllowed: allowAllGroups || allowedIds.includes(g.id),
      isAutoReply: autoReplyIds.includes(g.id),
    }));

    return c.json({ success: true, data: result, cached: false });
  } catch (e) {
    console.error('[GroupsAPI] Error:', e);
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// POST /groups/refresh - Xóa cache, buộc fetch lại
groupsApi.post('/refresh', (c) => {
  bustGroupsCache();
  return c.json({ success: true, message: 'Cache cleared' });
});

// POST /groups/:id/auto-reply - bật/tắt auto-reply cho 1 nhóm từ web
groupsApi.post('/:id/auto-reply', async (c) => {
  try {
    const api = container.get<any>(Services.ZALO_API);
    if (!api) return c.json({ success: false, error: 'Zalo API chưa sẵn sàng.' }, 503);

    const groupId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);
    const announce = body?.announce === true;

    await setAutoReply(api, groupId, enabled, { announce });

    return c.json({
      success: true,
      data: {
        groupId,
        enabled,
      },
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// POST /groups/resolve - Tra tên/avatar cho danh sách ID chưa biết
// Thử getGroupInfo trước, nếu không có thì thử getUserInfo
groupsApi.post('/resolve', async (c) => {
  try {
    const api = container.get<any>(Services.ZALO_API);
    if (!api) return c.json({ success: false, error: 'Zalo API chưa sẵn sàng.' }, 503);

    const body = await c.req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.slice(0, 30) : [];
    if (ids.length === 0) return c.json({ success: true, data: {} });

    const result: Record<string, { name: string; avatar: string; type: 'group' | 'user' | 'unknown' }> = {};

    // 1. Thử getGroupInfo cho tất cả IDs
    try {
      const groupRes = await api.getGroupInfo(ids);
      const gridInfoMap = groupRes?.gridInfoMap ?? {};
      for (const id of ids) {
        const info = gridInfoMap[id];
        if (info?.name) {
          result[id] = {
            name: info.name,
            avatar: info.fullAvt || info.avt || '',
            type: 'group',
          };
        }
      }
    } catch { /* bỏ qua */ }

    // 2. Với các ID chưa resolve được, thử getUserInfo
    const unresolved = ids.filter((id) => !result[id]);
    for (const id of unresolved) {
      try {
        const userRes = await api.getUserInfo(id);
        const profile = userRes?.changed_profiles?.[id];
        if (profile?.displayName || profile?.zaloName) {
          result[id] = {
            name: profile.displayName || profile.zaloName,
            avatar: profile.avatar || '',
            type: 'user',
          };
        }
      } catch { /* bỏ qua */ }
    }

    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});
