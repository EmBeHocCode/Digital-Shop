import { CONFIG } from '../../../core/config/config.js';

export interface ParsedBangCommand {
  isCommand: boolean;
  rawName: string;
  normalizedName: string;
}

export interface CommandScopeInput {
  senderId: string;
  threadId: string;
  isGroup: boolean;
}

function normalize(value: string): string {
  return value.trim().replace(/^!+/, '').toLowerCase();
}

export function parseBangCommand(text: string): ParsedBangCommand {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const candidate = lines[lines.length - 1] ?? text.trim();
  if (!candidate.startsWith('!')) {
    return { isCommand: false, rawName: '', normalizedName: '' };
  }

  const rawName = candidate.slice(1).trim().split(/\s+/)[0] ?? '';
  return {
    isCommand: rawName.length > 0,
    rawName,
    normalizedName: normalize(rawName),
  };
}

export function getAdminUserIds(): string[] {
  const primary = CONFIG.adminUserId ? [CONFIG.adminUserId] : [];
  const extras = CONFIG.commandAccess?.additionalAdminUserIds ?? [];
  const set = new Set<string>();
  for (const id of [...primary, ...extras]) {
    const trimmed = String(id ?? '').trim();
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set);
}

export function isAdminUser(senderId: string): boolean {
  if (!senderId) return false;
  return getAdminUserIds().includes(senderId);
}

export function areCommandsEnabledForUser(senderId: string): boolean {
  if (isAdminUser(senderId)) return true;
  return CONFIG.commandAccess?.commandsEnabled ?? true;
}

export function isUserAllowedInScope(senderId: string): boolean {
  if (isAdminUser(senderId)) return true;
  const allowedUsers = CONFIG.allowedUserIds ?? [];
  if (allowedUsers.length === 0) return true;
  return allowedUsers.includes(senderId);
}

export function isGroupAllowedInScope(threadId: string): boolean {
  if (CONFIG.allowAllGroups ?? true) return true;
  const allowedGroups = CONFIG.allowedGroupIds ?? [];
  return allowedGroups.includes(threadId);
}

export function isCommandScopeAllowed(input: CommandScopeInput): boolean {
  const { senderId, threadId, isGroup } = input;
  if (!areCommandsEnabledForUser(senderId)) return false;
  if (isAdminUser(senderId)) return true;

  // Mặc định command access tách riêng khỏi whitelist chat toàn cục.
  // Bật "respectGlobalAccessLists" nếu muốn quay về behavior cũ.
  const respectGlobalAccessLists = CONFIG.commandAccess?.respectGlobalAccessLists ?? false;
  if (respectGlobalAccessLists) {
    if (!isUserAllowedInScope(senderId)) return false;
    if (isGroup && !isGroupAllowedInScope(threadId)) return false;
  }

  return true;
}

export function isNonAdminCommandAllowed(commandName: string): boolean {
  const allowed = CONFIG.commandAccess?.nonAdminAllowedCommands ?? [];
  if (allowed.length === 0) return true;

  const needle = normalize(commandName);
  return allowed.some((item) => normalize(item) === needle);
}

export function isCommandDisabled(commandName: string): boolean {
  const disabled = CONFIG.commandAccess?.disabledCommands ?? [];
  if (disabled.length === 0) return false;
  const needle = normalize(commandName);
  return disabled.some((item) => normalize(item) === needle);
}

export function getCommandRole(commandName: string): 'everyone' | 'admin' {
  const roles = CONFIG.commandAccess?.commandRoles ?? {};
  const needle = normalize(commandName);
  // Check exact key first, then normalized
  for (const [key, role] of Object.entries(roles)) {
    if (normalize(key) === needle) return role;
  }
  return 'everyone';
}

export function isCommandAllowedForUser(commandName: string, senderId: string): boolean {
  // Disabled commands: nobody can use
  if (isCommandDisabled(commandName)) return false;
  // Admin always allowed
  if (isAdminUser(senderId)) return true;
  // Check per-command role
  const role = getCommandRole(commandName);
  if (role === 'admin') return false;
  // Check nonAdminAllowedCommands whitelist
  return isNonAdminCommandAllowed(commandName);
}

export function getCommandDenyMessage(): string {
  const msg = CONFIG.commandAccess?.denyMessage?.trim();
  return msg || '⛔ Bạn không có quyền sử dụng lệnh này.';
}
