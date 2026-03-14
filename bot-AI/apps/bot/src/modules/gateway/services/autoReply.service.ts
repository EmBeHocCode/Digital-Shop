/**
 * AutoReply Service - Quản lý trạng thái tự reply theo từng nhóm
 *
 * #onbot  → bot tự reply TẤT CẢ tin nhắn trong nhóm (không cần @mention)
 * #unbot  → trở về chế độ bình thường (cần @mention mới reply)
 *
 * Trạng thái được persist vào settings.json (autoReplyGroupIds)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../../../core/config/config.js';
import { debugLog } from '../../../core/logger/logger.js';
import { ThreadType } from '../../../infrastructure/messaging/zalo/zalo.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../../');
const settingsPath = path.join(projectRoot, 'settings.json');

/**
 * Kiểm tra nhóm có đang bật chế độ tự reply không
 */
export function isAutoReplyEnabled(groupId: string): boolean {
  return (CONFIG.autoReplyGroupIds ?? []).includes(groupId);
}

/**
 * Lấy danh sách nhóm đang bật tự reply
 */
export function getAutoReplyGroups(): string[] {
  return [...(CONFIG.autoReplyGroupIds ?? [])];
}

/**
 * Bật/tắt tự reply cho một nhóm
 * Ghi vào settings.json để persist qua restart
 */
export async function setAutoReply(
  api: any,
  threadId: string,
  enabled: boolean,
  options?: {
    announce?: boolean;
  },
): Promise<void> {
  const list: string[] = CONFIG.autoReplyGroupIds ?? [];

  if (enabled) {
    if (!list.includes(threadId)) {
      list.push(threadId);
      CONFIG.autoReplyGroupIds = list;
    }
  } else {
    const idx = list.indexOf(threadId);
    if (idx !== -1) {
      list.splice(idx, 1);
      CONFIG.autoReplyGroupIds = list;
    }
  }

  // Persist vào settings.json
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    settings.autoReplyGroupIds = CONFIG.autoReplyGroupIds;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    debugLog('AUTO_REPLY', `Saved autoReplyGroupIds: ${JSON.stringify(CONFIG.autoReplyGroupIds)}`);
  } catch (e) {
    console.error('[AutoReply] ❌ Lỗi lưu settings:', e);
  }

  const shouldAnnounce = options?.announce ?? true;
  if (!shouldAnnounce) {
    console.log(`[AutoReply] ${enabled ? '🟢 ON' : '🔴 OFF'} cho nhóm ${threadId} (silent)`);
    return;
  }

  // Gửi xác nhận vào chính nhóm đó
  const statusText = enabled
    ? '🟢 Chế độ tự reply đã BẬT — bot sẽ trả lời mọi tin nhắn trong nhóm này.\n\nDùng #unbot để tắt.'
    : '🔴 Chế độ tự reply đã TẮT — bot chỉ reply khi được @mention.\n\nDùng #onbot để bật lại.';

  try {
    await api.sendMessage(statusText, threadId, ThreadType.Group);
    console.log(`[AutoReply] ${enabled ? '🟢 ON' : '🔴 OFF'} cho nhóm ${threadId}`);
  } catch (e) {
    console.error('[AutoReply] Lỗi gửi xác nhận:', e);
  }
}
