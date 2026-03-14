/**
 * API Server - Hono HTTP server cho bot management
 * Tất cả API endpoints cho Dashboard
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';
import { settingsApi, onSettingsChange } from './settings.api.js';
import { statsApi } from './stats.api.js';
import { tasksApi } from './tasks.api.js';
import { memoriesApi } from './memories.api.js';
import { historyApi } from './history.api.js';
import { logsApi } from './logs.api.js';
import { backupApi } from './backup.api.js';
import { envApi } from './env.api.js';
import { groupsApi, bustGroupsCache } from './groups.api.js';
import { contactsApi } from './contacts.api.js';
import { commandsApi } from './commands.api.js';
import { zaloAuthApi } from './zalo-auth.api.js';
import { chatApi } from './chat.api.js';

// API Key từ env - dùng chung cho cả dự án
const API_KEY = process.env.API_KEY;

export const apiApp = new Hono();

// CORS cho tất cả routes
apiApp.use('*', cors());

// Bearer auth middleware - chỉ bật khi có API_KEY
if (API_KEY) {
  apiApp.use('*', bearerAuth({ token: API_KEY }));
  console.log('[API] 🔐 Authentication enabled for all endpoints');
} else {
  console.warn('[API] ⚠️ No API_KEY set - API is PUBLIC (dev mode only!)');
}

// Health check (không cần auth)
apiApp.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount all API routes
apiApp.route('/settings', settingsApi);
apiApp.route('/stats', statsApi);
apiApp.route('/tasks', tasksApi);
apiApp.route('/memories', memoriesApi);
apiApp.route('/history', historyApi);
apiApp.route('/logs', logsApi);
apiApp.route('/backup', backupApi);
apiApp.route('/env', envApi);
apiApp.route('/groups', groupsApi);
apiApp.route('/contacts', contactsApi);
apiApp.route('/commands', commandsApi);
apiApp.route('/zalo-auth', zaloAuthApi);
apiApp.route('/web-chat', chatApi);

// API documentation endpoint
apiApp.get('/', (c) => {
  return c.json({
    name: 'Zia Bot API',
    version: '1.0.0',
    endpoints: {
      '/health': 'Health check',
      '/settings': 'Bot settings management',
      '/stats': 'System statistics',
      '/tasks': 'Background tasks',
      '/memories': 'Shared memory (bộ nhớ chung)',
      '/history': 'Conversation history',
      '/logs': 'System logs',
      '/backup': 'Database backup & restore',
      '/env': 'Environment variables (.env) management',
      '/groups': 'Zalo groups list (for group picker UI)',
      '/contacts': 'Zalo friends/contacts list',
      '/commands': 'Command catalog (for quick command + web sync)',
      '/zalo-auth': 'Zalo login status, QR image and session cleanup',
      '/web-chat': 'Web dashboard chat session endpoint',
    },
  });
});

// Export
export { onSettingsChange };
export { settingsApi };
