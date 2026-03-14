/**
 * Per-thread AI Role Store
 * Lưu role override cho từng thread (meow/assistant)
 * Reset khi bot restart (in-memory only)
 */

export type ThreadRole = 'meow' | 'assistant';

// threadId → role (undefined = dùng CONFIG.useCharacter mặc định)
const threadRoles = new Map<string, ThreadRole>();

/**
 * Lấy role của thread (undefined = dùng default)
 */
export function getThreadRole(threadId: string): ThreadRole | undefined {
  return threadRoles.get(threadId);
}

/**
 * Lấy giá trị useCharacter cho thread
 * Trả về undefined nếu chưa set (dùng CONFIG.useCharacter)
 */
export function getThreadUseCharacter(threadId: string): boolean | undefined {
  const role = threadRoles.get(threadId);
  if (role === undefined) return undefined;
  return role === 'meow';
}

/**
 * Set role cho thread
 */
export function setThreadRole(threadId: string, role: ThreadRole): void {
  threadRoles.set(threadId, role);
}

/**
 * Xóa role override (về mặc định)
 */
export function clearThreadRole(threadId: string): void {
  threadRoles.delete(threadId);
}

/**
 * Lấy tên role hiển thị
 */
export function getThreadRoleLabel(threadId: string): string {
  const role = threadRoles.get(threadId);
  switch (role) {
    case 'meow':
      return '🐱 Nhân vật Meow';
    case 'assistant':
      return '🤖 Trợ lý AI';
    default:
      return '⚙️ Mặc định (theo cài đặt)';
  }
}

/**
 * Danh sách roles có sẵn
 */
export const AVAILABLE_ROLES: { key: string; label: string; role: ThreadRole | null }[] = [
  { key: 'meow', label: '🐱 Meow - Nhân vật AI cô gái', role: 'meow' },
  { key: 'assistant', label: '🤖 Assistant - Trợ lý AI thuần', role: 'assistant' },
  { key: 'reset', label: '↩️ Reset - Về mặc định cài đặt', role: null },
];
