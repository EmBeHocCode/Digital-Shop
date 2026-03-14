import { Hono } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SettingsSchema } from '../../core/config/config.schema.js';
import { reloadSettingsFromData } from '../../core/config/config.js';
import {
  getCommandByName,
  getCommandCatalogData,
  searchCommands,
} from '../commands/commands.catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');
const settingsPath = path.join(projectRoot, 'settings.json');

function loadSettings() {
  const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const result = SettingsSchema.safeParse(raw);
  if (!result.success) throw new Error('Invalid settings.json');
  return result.data;
}

function saveSettings(settings: ReturnType<typeof loadSettings>) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  reloadSettingsFromData(settings);
}

export const commandsApi = new Hono();

// GET /commands - catalog lệnh cho dashboard
commandsApi.get('/', (c) => {
  try {
    const q = (c.req.query('q') || '').trim();
    const moduleFilter = (c.req.query('module') || '').trim().toLowerCase();
    const catalog = getCommandCatalogData();
    const originalTotal = catalog.total;

    let builtIn = catalog.builtIn;
    let tools = catalog.tools;

    if (q) {
      const searched = searchCommands(q);
      builtIn = searched.filter((cmd) => cmd.builtIn);
      tools = searched.filter((cmd) => !cmd.builtIn);
    }

    if (moduleFilter) {
      builtIn = builtIn.filter((cmd) => cmd.module.toLowerCase() === moduleFilter);
      tools = tools.filter((cmd) => cmd.module.toLowerCase() === moduleFilter);
    }

    // Khi đang search/filter, rebuild byModule từ kết quả đã lọc cho dropdown
    // Nhưng luôn giữ full byModule trong allModules để dropdown search module vẫn hiện đủ
    const filteredByModuleMap = new Map<string, { module: string; moduleLabel: string; count: number; commands: typeof tools }>();
    for (const cmd of tools) {
      const existing = filteredByModuleMap.get(cmd.module);
      if (!existing) {
        filteredByModuleMap.set(cmd.module, { module: cmd.module, moduleLabel: cmd.moduleLabel, count: 1, commands: [cmd] });
      } else {
        existing.count++;
        existing.commands.push(cmd);
      }
    }
    const filteredByModule = Array.from(filteredByModuleMap.values()).sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));

    return c.json({
      success: true,
      data: {
        prefix: catalog.prefix,
        requirePrefix: catalog.requirePrefix,
        builtIn,
        tools,
        byModule: catalog.byModule,
        filteredByModule: (q || moduleFilter) ? filteredByModule : catalog.byModule,
        total: builtIn.length + tools.length,
        originalTotal,
      },
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// GET /commands/:name - chi tiết 1 lệnh
commandsApi.get('/:name', (c) => {
  try {
    const name = c.req.param('name');
    const command = getCommandByName(name);
    if (!command) {
      return c.json({ success: false, error: 'Command not found' }, 404);
    }
    return c.json({ success: true, data: command });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// PATCH /commands/:name/role - Set role cho lệnh (everyone | admin)
commandsApi.patch('/:name/role', async (c) => {
  try {
    const name = c.req.param('name');
    const body = await c.req.json();
    const role = body?.role as string;

    if (role !== 'everyone' && role !== 'admin') {
      return c.json({ success: false, error: 'role phải là "everyone" hoặc "admin"' }, 400);
    }

    const command = getCommandByName(name);
    if (!command) {
      return c.json({ success: false, error: 'Command not found' }, 404);
    }

    const settings = loadSettings();
    const commandRoles = { ...(settings.commandAccess?.commandRoles ?? {}) };

    if (role === 'everyone') {
      delete commandRoles[command.name];
    } else {
      commandRoles[command.name] = role;
    }

    settings.commandAccess = { ...settings.commandAccess, commandRoles };
    saveSettings(settings);

    return c.json({ success: true, data: { name: command.name, role } });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// PATCH /commands/:name/toggle - Enable/disable lệnh
commandsApi.patch('/:name/toggle', async (c) => {
  try {
    const name = c.req.param('name');
    const body = await c.req.json();
    const enabled = body?.enabled as boolean;

    if (typeof enabled !== 'boolean') {
      return c.json({ success: false, error: 'enabled phải là boolean' }, 400);
    }

    const command = getCommandByName(name);
    if (!command) {
      return c.json({ success: false, error: 'Command not found' }, 404);
    }

    const settings = loadSettings();
    let disabledCommands = [...(settings.commandAccess?.disabledCommands ?? [])];

    if (enabled) {
      disabledCommands = disabledCommands.filter((c) => c.toLowerCase() !== command.name.toLowerCase());
    } else {
      if (!disabledCommands.some((c) => c.toLowerCase() === command.name.toLowerCase())) {
        disabledCommands.push(command.name);
      }
    }

    settings.commandAccess = { ...settings.commandAccess, disabledCommands };
    saveSettings(settings);

    return c.json({ success: true, data: { name: command.name, enabled } });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});
