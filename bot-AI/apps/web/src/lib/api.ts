/**
 * API Client - Kết nối với Bot API qua Next.js API Routes
 * Credentials được giữ server-side, không expose ra client
 */
import axios from 'axios';

// Gọi qua internal API route - credentials được xử lý server-side
const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Khi bot offline (502/503/ECONNREFUSED) — trả về data rỗng thay vì throw
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isBotOffline =
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ERR_NETWORK';
    if (isBotOffline) {
      // Trả về response giả với data rỗng để UI không crash
      return Promise.resolve({
        data: { success: false, botOffline: true, data: null },
        status: status ?? 0,
        statusText: 'Bot Offline',
        headers: {},
        config: error.config,
      });
    }
    return Promise.reject(error);
  }
);

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string;
  details?: unknown;
  botOffline?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stats types
export interface StatsOverview {
  messages: number;
  memories: number;
  tasks: number;
  messagesLast24h: number;
  tasksByStatus: Record<string, number>;
  uptime: number;
  timestamp: string;
}

export interface MessageStats {
  date: string;
  role: string;
  count: number;
}

export interface ActiveThread {
  thread_id: string;
  message_count: number;
  last_activity: number;
}

// Task types
export interface Task {
  id: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  targetUserId: string | null;
  targetThreadId: string | null;
  payload: string;
  context: string | null;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  result: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Memory types
export interface Memory {
  id: number;
  content: string;
  userId: string | null;
  userName: string | null;
  importance: number;
  createdAt: Date;
  lastAccessedAt: Date | null;
  accessCount: number;
  metadata: string | null;
}

// History types
export interface HistoryEntry {
  id: number;
  threadId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface Thread {
  thread_id: string;
  message_count: number;
  first_message: number;
  last_message: number;
}

// Settings types
export interface SleepModeSettings {
  enabled: boolean;
  sleepHour: number;
  wakeHour: number;
  checkIntervalMs: number;
}

export interface MaintenanceModeSettings {
  enabled: boolean;
  message: string;
}

export interface CloudDebugSettings {
  enabled: boolean;
  prefix: string;
  matchAnyHash: boolean;
}

export interface DirectMessageAutoReplySettings {
  enabled: boolean;
  message: string;
  cooldownMs: number;
  dailyLimit: number;
}

export interface BotConfig {
  name: string;
  prefix: string;
  requirePrefix: boolean;
  rateLimitMs: number;
  maxTokenHistory: number;
  maxInputTokens: number;
  selfListen: boolean;
  logging: boolean;
  useStreaming: boolean;
  useCharacter: boolean;
  fileLogging: boolean;
  maxToolDepth: number;
  showToolCalls: boolean;
  allowNSFW: boolean;
  customSystemPrompt: string;
  cloudDebug: CloudDebugSettings;
  strangerAutoReply: DirectMessageAutoReplySettings;
  friendDmReplyEnabled: boolean;
  privateAutoReply: DirectMessageAutoReplySettings;
  sleepMode: SleepModeSettings;
  maintenanceMode: MaintenanceModeSettings;
}

export interface GeminiConfig {
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  thinkingBudget: number;
  models: string[];
  rateLimitMinuteMs: number;
  rateLimitDayMs: number;
}

export interface GroqModelsConfig {
  primary: string;
  fallback: string;
  primaryMaxTokens: number;
  fallbackMaxTokens: number;
  temperature: number;
  topP: number;
}

export interface BufferConfig {
  delayMs: number;
  typingRefreshMs: number;
}

export interface HistoryConfig {
  maxTrimAttempts: number;
  maxContextTokens: number;
  estimatedCharsPerToken: number;
}

export interface MemoryConfig {
  decayHalfLifeDays: number;
  accessBoostFactor: number;
  embeddingModel: string;
}

export interface CloudBackupConfig {
  enabled: boolean;
  throttleMs: number;
  restoreDelayMs: number;
  initialBackupDelayMs: number;
}

export interface BackgroundAgentConfig {
  pollIntervalMs: number;
  maxToolIterations: number;
  groupBatchSize: number;
  batchDelayMinMs: number;
  batchDelayMaxMs: number;
  groqEnabled: boolean;
  allowedTools: string[];
}

export interface CommandAccessConfig {
  commandsEnabled: boolean;
  respectGlobalAccessLists: boolean;
  additionalAdminUserIds: string[];
  nonAdminAllowedCommands: string[];
  denyMessage: string;
}

export interface UserProfileData {
  displayName: string;
  pronouns: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
}

export interface DashboardProfiles {
  admin: UserProfileData;
  bot: UserProfileData;
}

export interface BotSettings {
  adminUserId: string;
  bot: BotConfig;
  modules: Record<string, boolean>;
  gemini: GeminiConfig;
  groqModels: GroqModelsConfig;
  buffer: BufferConfig;
  history: HistoryConfig;
  memory: MemoryConfig;
  cloudBackup: CloudBackupConfig;
  backgroundAgent: BackgroundAgentConfig;
  commandAccess: CommandAccessConfig;
  allowedUserIds: string[];
  allowedGroupIds: string[];
  allowAllGroups: boolean;
  profiles?: DashboardProfiles;
  [key: string]: unknown;
}

// API functions
export const statsApi = {
  getOverview: () => api.get<ApiResponse<StatsOverview>>('/stats/overview'),
  getMessages: (days = 7) => api.get<ApiResponse<MessageStats[]>>(`/stats/messages?days=${days}`),
  getActiveThreads: (limit = 10) =>
    api.get<ApiResponse<ActiveThread[]>>(`/stats/active-threads?limit=${limit}`),
};

export const tasksApiClient = {
  list: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params }),
  get: (id: number) => api.get<ApiResponse<Task>>(`/tasks/${id}`),
  create: (data: { type: string; targetUserId?: string; targetThreadId?: string; payload: object; context?: string }) =>
    api.post<ApiResponse<Task>>('/tasks', data),
  cancel: (id: number) => api.post<ApiResponse<void>>(`/tasks/${id}/cancel`),
  retry: (id: number) => api.post<ApiResponse<void>>(`/tasks/${id}/retry`),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/tasks/${id}`),
};

export const memoriesApiClient = {
  list: (params?: { page?: number; limit?: number; userId?: string; search?: string }) =>
    api.get<PaginatedResponse<Memory>>('/memories', { params }),
  get: (id: number) => api.get<ApiResponse<Memory>>(`/memories/${id}`),
  create: (data: Partial<Memory>) => api.post<ApiResponse<Memory>>('/memories', data),
  update: (id: number, data: Partial<Memory>) => api.patch<ApiResponse<Memory>>(`/memories/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/memories/${id}`),
};

export const historyApiClient = {
  list: (params?: { page?: number; limit?: number; threadId?: string; role?: string }) =>
    api.get<PaginatedResponse<HistoryEntry>>('/history', { params }),
  getThreads: (limit = 50) => api.get<ApiResponse<Thread[]>>(`/history/threads?limit=${limit}`),
  getThread: (threadId: string, limit = 100) =>
    api.get<ApiResponse<HistoryEntry[]>>(`/history/thread/${threadId}?limit=${limit}`),
  deleteThread: (threadId: string) => api.delete<ApiResponse<void>>(`/history/thread/${threadId}`),
  deleteOld: (days = 30) => api.delete<ApiResponse<{ deleted: number }>>(`/history/old?days=${days}`),
};

export const settingsApiClient = {
  get: () => api.get<ApiResponse<BotSettings>>('/settings'),
  getSection: (key: string) => api.get<ApiResponse<unknown>>(`/settings/${key}`),
  update: (data: BotSettings) => api.put<ApiResponse<void>>('/settings', data),
  updateSection: (key: string, data: unknown) => api.patch<ApiResponse<unknown>>(`/settings/${key}`, data),
  reload: () => api.post<ApiResponse<void>>('/settings/reload'),
};

export const logsApiClient = {
  listFolders: () => api.get<ApiResponse<{ name: string; path: string }[]>>('/logs'),
  listFiles: (folder: string) =>
    api.get<ApiResponse<{ name: string; size: number; modified: string }[]>>(`/logs/${folder}`),
  getFile: (folder: string, file: string, lines = 100) =>
    api.get<ApiResponse<{ lines: string[]; totalLines: number; hasMore: boolean }>>(
      `/logs/${folder}/${file}?lines=${lines}`,
    ),
  getUnauthorized: () => api.get<ApiResponse<unknown[]>>('/logs/file/unauthorized'),
  deleteFolder: (folder: string) => api.delete<ApiResponse<void>>(`/logs/${folder}`),
  getDownloadUrl: (folder: string, file: string) => `/api/logs/download/${folder}/${file}`,
};

// Backup types
export interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export interface DatabaseInfo {
  path: string;
  size: number;
  modifiedAt: string;
  tables: Record<string, number>;
}

// Env key types
export interface EnvKeyItem {
  key: string;
  masked: string;
  isEmpty: boolean;
  isSet: boolean;
}

export interface EnvGroup {
  group: string;
  description: string;
  keys: string[];
  items: EnvKeyItem[];
}

export interface GeminiKeyInfo {
  index: number;
  masked: string;
  available: boolean;
  blockedUntil?: string;
  retryCount?: number;
}

export interface GeminiKeyStatus {
  currentKeyIndex: number;
  totalKeys: number;
  nextKeyIndex: number | null;
  keys: GeminiKeyInfo[];
  currentModel: string;
  models: { model: string; name: string; available: boolean; blockedUntil?: string }[];
}

export const envApiClient = {
  getGroups: () => api.get<ApiResponse<{ groups: EnvGroup[] }>>('/env'),
  getRaw: (key: string) => api.get<ApiResponse<{ key: string; value: string }>>(`/env/raw/${key}`),
  update: (updates: Record<string, string>) => api.put<ApiResponse<{ updated: string[] }>>('/env', { updates }),
  validate: (force?: boolean) =>
    api.get<ApiResponse<{ results: ApiKeyHealthItem[] }>>('/env/validate', { params: force ? { force: '1' } : {} }),
  getGeminiStatus: () =>
    api.get<ApiResponse<GeminiKeyStatus>>('/env/gemini-status'),
};

export type ApiKeyStatus = 'valid' | 'invalid' | 'missing' | 'error';
export interface ApiKeyHealthItem {
  key: string;
  status: ApiKeyStatus;
  message?: string;
  checkedAt: string;
}

export interface EnvDirectKey {
  key: string;
  isSet: boolean;
  masked: string;
}

export const envDirectClient = {
  /** Get all raw keys (no values) directly from .env file */
  list: () => api.get<ApiResponse<{ keys: EnvDirectKey[] }>>('/env-direct'),
  /** Get raw (unmasked) value of a single key directly from .env file */
  getRaw: (key: string) => api.get<ApiResponse<{ key: string; value: string }>>(`/env-direct?key=${encodeURIComponent(key)}`),
  /** Set (upsert) a key in .env */
  set: (key: string, value: string) => api.put<ApiResponse<{ key: string; updated: boolean }>>('/env-direct', { key, value }),
  /** Delete a key from .env entirely */
  remove: (key: string) => api.delete<ApiResponse<{ key: string; deleted: boolean }>>('/env-direct', { data: { key } }),
};

export const backupApiClient = {
  list: () => api.get<ApiResponse<BackupFile[]>>('/backup'),
  create: () => api.post<ApiResponse<BackupFile>>('/backup'),
  restore: (name: string) => api.post<ApiResponse<{ restoredFrom: string; preRestoreBackup: string }>>(`/backup/restore/${name}`),
  delete: (name: string) => api.delete<ApiResponse<{ deleted: string }>>(`/backup/${name}`),
  getInfo: () => api.get<ApiResponse<DatabaseInfo>>('/backup/info'),
  getDownloadUrl: (name: string) => `/api/backup/download/${name}`,
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<BackupFile>>('/backup/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  resetDatabase: () => api.delete<ApiResponse<{ message: string; preDeleteBackup: string }>>('/backup/database'),
};

// Groups (Zalo group list for Group Picker UI)
export interface ZaloGroup {
  id: string;
  name: string;
  memberCount: number;
  avatar: string;
  isAllowed: boolean;
  isAutoReply: boolean;
}

export type ResolvedInfo = { name: string; avatar: string; type: 'group' | 'user' | 'unknown' };

export const groupsApiClient = {
  getAll: () => api.get<ApiResponse<ZaloGroup[]>>('/groups'),
  refresh: () => api.post<ApiResponse<{ message: string }>>('/groups/refresh'),
  setAutoReply: (groupId: string, enabled: boolean, announce = false) =>
    api.post<ApiResponse<{ groupId: string; enabled: boolean }>>(`/groups/${groupId}/auto-reply`, {
      enabled,
      announce,
    }),
  resolve: (ids: string[]) =>
    api.post<ApiResponse<Record<string, ResolvedInfo>>>('/groups/resolve', { ids }),
};

export type ZaloContact = {
  userId: string;
  displayName: string;
  avatar: string;
};

export const contactsApiClient = {
  getAll: () => api.get<ApiResponse<ZaloContact[]>>('/contacts'),
  refresh: () => api.post<ApiResponse<{ message: string }>>('/contacts/refresh'),
};

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface CommandItem {
  name: string;
  description: string;
  module: string;
  moduleLabel: string;
  aliases: string[];
  parameters: CommandParameter[];
  parameterCount: number;
  builtIn: boolean;
  example?: string;
  requiresApiKey?: string;
  disabled: boolean;
  role: 'everyone' | 'admin';
}

export interface CommandModuleGroup {
  module: string;
  moduleLabel: string;
  count: number;
  commands: CommandItem[];
}

export interface CommandCatalog {
  prefix: string;
  requirePrefix: boolean;
  builtIn: CommandItem[];
  tools: CommandItem[];
  byModule: CommandModuleGroup[];
  filteredByModule: CommandModuleGroup[];
  total: number;
  originalTotal: number;
}

export const commandsApiClient = {
  list: (params?: { q?: string; module?: string }) =>
    api.get<ApiResponse<CommandCatalog>>('/commands', { params }),
  get: (name: string) => api.get<ApiResponse<CommandItem>>(`/commands/${name}`),
  setRole: (name: string, role: 'everyone' | 'admin') =>
    api.patch<ApiResponse<{ name: string; role: string }>>(`/commands/${name}/role`, { role }),
  toggle: (name: string, enabled: boolean) =>
    api.patch<ApiResponse<{ name: string; enabled: boolean }>>(`/commands/${name}/toggle`, { enabled }),
};

export interface WebChatReply {
  sessionId: string;
  reply: string;
  reactions: string[];
}

export const webChatApiClient = {
  send: (data: { message: string; sessionId?: string; reset?: boolean }) =>
    api.post<ApiResponse<WebChatReply>>('/web-chat', data),
  clearSession: (sessionId: string) =>
    api.delete<ApiResponse<{ sessionId: string }>>(`/web-chat/${encodeURIComponent(sessionId)}`),
};
