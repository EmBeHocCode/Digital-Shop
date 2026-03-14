import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../../../core/config/config.js';
import { debugLog } from '../../../core/logger/logger.js';
import { isAdminUser } from '../../../shared/utils/access/commandAccess.js';
import { now } from '../../../shared/utils/datetime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const settingsPath = path.join(projectRoot, 'settings.json');

/**
 * Kiểm tra user có được phép không
 */
export function isUserAllowed(userId: string, userName: string): boolean {
  return isAllowedUser(userId, userName);
}

/**
 * Kiểm tra group có được phép không
 */
export function isGroupAllowed(_groupId: string): boolean {
  // Hiện tại chưa có config allowedGroupIds, cho phép tất cả
  return true;
}

// Cache để tránh ghi trùng lặp
const loggedUnauthorizedUsers = new Set<string>();

/**
 * Kiểm tra user có được phép sử dụng bot không (theo ID)
 */
export function isAllowedUser(userId: string, userName: string): boolean {
  if (isAdminUser(userId)) {
    debugLog('USER_FILTER', `Allowed (admin): id=${userId}, name="${userName}"`);
    return true;
  }

  // Nếu danh sách rỗng, cho phép tất cả
  if (!CONFIG.allowedUserIds || CONFIG.allowedUserIds.length === 0) {
    debugLog('USER_FILTER', `Allowed (no filter): id=${userId}, name="${userName}"`);
    return true;
  }

  // Kiểm tra ID có trong danh sách không
  const allowed = CONFIG.allowedUserIds.includes(userId);
  debugLog(
    'USER_FILTER',
    `${
      allowed ? 'Allowed' : 'Blocked'
    }: id=${userId}, name="${userName}", allowedIds=[${CONFIG.allowedUserIds.join(', ')}]`,
  );

  // Nếu không được phép, ghi log ra file
  if (!allowed) {
    logUnauthorizedUser(userId, userName);
  }

  return allowed;
}

/**
 * Ghi log người dùng chưa được cấp phép vào file JSON
 */
function logUnauthorizedUser(userId: string, userName: string): void {
  // Tránh ghi trùng trong cùng session
  if (loggedUnauthorizedUsers.has(userId)) {
    return;
  }
  loggedUnauthorizedUsers.add(userId);

  const logFilePath = path.resolve(CONFIG.unauthorizedLogFile || 'logs/unauthorized.json');
  const logDir = path.dirname(logFilePath);

  // Tạo thư mục nếu chưa có
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Đọc file hiện tại hoặc tạo mới
  let unauthorizedList: Array<{
    id: string;
    name: string;
    firstSeen: string;
    lastSeen: string;
  }> = [];
  if (fs.existsSync(logFilePath)) {
    try {
      const data = fs.readFileSync(logFilePath, 'utf-8');
      unauthorizedList = JSON.parse(data);
    } catch {
      unauthorizedList = [];
    }
  }

  // Kiểm tra xem user đã có trong list chưa
  const existingIndex = unauthorizedList.findIndex((u) => u.id === userId);
  const currentTime = now();

  if (existingIndex >= 0) {
    // Cập nhật lastSeen và name (có thể đổi tên)
    unauthorizedList[existingIndex].lastSeen = currentTime;
    unauthorizedList[existingIndex].name = userName;
  } else {
    // Thêm mới
    unauthorizedList.push({
      id: userId,
      name: userName,
      firstSeen: currentTime,
      lastSeen: currentTime,
    });
    console.log(`[UserFilter] 📝 Ghi nhận user mới chưa được cấp phép: ${userName} (${userId})`);
  }

  // Ghi file
  fs.writeFileSync(logFilePath, JSON.stringify(unauthorizedList, null, 2));
  debugLog('USER_FILTER', `Logged unauthorized user: id=${userId}, name="${userName}"`);
}

/**
 * Thêm user ID vào danh sách được phép
 */
export function addAllowedUserId(userId: string): boolean {
  if (CONFIG.allowedUserIds.includes(userId)) return false;
  CONFIG.allowedUserIds.push(userId);
  saveSettings();
  return true;
}

/**
 * Xóa user ID khỏi danh sách được phép
 */
export function removeAllowedUserId(userId: string): boolean {
  const index = CONFIG.allowedUserIds.indexOf(userId);
  if (index === -1) return false;
  CONFIG.allowedUserIds.splice(index, 1);
  saveSettings();
  return true;
}

/**
 * Lấy danh sách user IDs được phép
 */
export function getAllowedUserIds(): string[] {
  return CONFIG.allowedUserIds;
}

/**
 * Lấy danh sách người dùng chưa được cấp phép từ file
 */
export function getUnauthorizedUsers(): Array<{
  id: string;
  name: string;
  firstSeen: string;
  lastSeen: string;
}> {
  const logFilePath = path.resolve(CONFIG.unauthorizedLogFile || 'logs/unauthorized.json');

  if (!fs.existsSync(logFilePath)) {
    return [];
  }

  try {
    const data = fs.readFileSync(logFilePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveSettings() {
  const data = fs.readFileSync(settingsPath, 'utf-8');
  const settings = JSON.parse(data);
  settings.allowedUserIds = CONFIG.allowedUserIds;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('[Config] ✅ Đã lưu danh sách user IDs');
}
