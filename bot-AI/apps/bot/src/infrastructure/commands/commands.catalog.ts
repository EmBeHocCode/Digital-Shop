import { CONFIG } from '../../core/config/config.js';
import { moduleManager } from '../../core/plugin-manager/module-manager.js';
import type { ITool, ToolParameter } from '../../core/types.js';
import { getCommandRole, isCommandDisabled } from '../../shared/utils/access/commandAccess.js';

export interface CommandCatalogItem {
  name: string;
  description: string;
  module: string;
  moduleLabel: string;
  aliases: string[];
  parameters: ToolParameter[];
  parameterCount: number;
  builtIn: boolean;
  example?: string;
  requiresApiKey?: string;
  disabled: boolean;
  role: 'everyone' | 'admin';
}

export interface CommandCatalogModule {
  module: string;
  moduleLabel: string;
  count: number;
  commands: CommandCatalogItem[];
}

export interface CommandCatalogData {
  prefix: string;
  requirePrefix: boolean;
  builtIn: CommandCatalogItem[];
  tools: CommandCatalogItem[];
  byModule: CommandCatalogModule[];
  total: number;
}

const MODULE_LABELS: Record<string, string> = {
  academic: 'Học vụ',
  chat: 'Chat & Memory',
  entertainment: 'Giải trí',
  gateway: 'Gateway',
  media: 'Media',
  search: 'Tìm kiếm',
  social: 'Xã hội',
  system: 'Hệ thống',
  task: 'Tác vụ',
};

const TOOL_ALIASES: Record<string, string[]> = {
  googleSearch: ['google'],
  weather: ['thoitiet'],
  youtubeSearch: ['youtube'],
  giphyGif: ['gif'],
  textToSpeech: ['voice'],
  qrCode: ['createqr'],
  scheduleTask: ['schedule', 'reminder'],
  solveMath: ['math'],
};

const TOOL_REQUIRES_API: Record<string, string> = {
  freepikImage: 'FREEPIK_API_KEY',
  textToSpeech: 'ELEVENLABS_API_KEY',
  giphyGif: 'GIPHY_API_KEY',
  youtubeSearch: 'YOUTUBE_API_KEY',
  googleSearch: 'GOOGLE_SEARCH_API_KEY',
  executeCode: 'E2B_API_KEY',
  scheduleTask: 'GROQ_API_KEY',
};

const TOOL_EXAMPLES: Record<string, string> = {
  googleSearch: '!google tin tức công nghệ hôm nay',
  weather: '!weather Hà Nội',
  youtubeSearch: '!youtube bài hát trending',
  currency: '!currency USD VND',
  steam: '!steam Elden Ring',
  createChart: '!createChart bar doanh thu theo quý',
  createFile: '!createFile báo cáo.docx Tóm tắt tháng 3',
  freepikImage: '!freepikImage hoàng hôn trên biển nhiệt đới',
  textToSpeech: '!voice Xin chào, tôi là trợ lý AI Zia',
  giphyGif: '!gif cat funny',
  executeCode: '!executeCode print("Hello World")',
  solveMath: '!math x^2 + 5x + 6 = 0',
  saveMemory: '!saveMemory Tên tôi là Minh, sinh ngày 1/1/2000',
  recallMemory: '!recallMemory ngày sinh của tôi',
  clearHistory: '!clearHistory',
  scheduleTask: '!schedule 0 8 * * * Gửi báo cáo buổi sáng',
  getUserInfo: '!getUserInfo',
  getGroupMembers: '!getGroupMembers',
  tvuSchedule: '!tvuSchedule',
  tvuGrades: '!tvuGrades',
  jikanSearch: '!jikanSearch Naruto',
  nekosImages: '!nekosImages waifu',
  poll: '!poll Bạn thích phở hay bún bò? | Phở | Bún bò',
  forwardMessage: '!forwardMessage',
};

const BUILT_IN_COMMANDS: Omit<CommandCatalogItem, 'moduleLabel' | 'parameterCount' | 'disabled' | 'role'>[] = [
  {
    name: 'help',
    description: 'Hướng dẫn nhanh các lệnh cơ bản',
    module: 'built-in',
    aliases: ['h', '?'],
    parameters: [],
    builtIn: true,
    example: '!help',
  },
  {
    name: 'command',
    description: 'Xem toàn bộ lệnh khả dụng hoặc tìm theo từ khóa',
    module: 'built-in',
    aliases: ['commands', 'cmd'],
    parameters: [
      {
        name: 'keyword',
        type: 'string',
        description: 'Từ khóa để lọc lệnh (tùy chọn)',
        required: false,
      },
    ],
    builtIn: true,
    example: '!command weather',
  },
  {
    name: 'game',
    description: 'Xem danh sách minigame và cách bắt đầu',
    module: 'built-in',
    aliases: ['games'],
    parameters: [
      {
        name: 'args',
        type: 'string',
        description: 'Ví dụ: taixiu | taixiu cuoc 100 xiu',
        required: false,
      },
    ],
    builtIn: true,
    example: '!game taixiu cuoc 100 xiu',
  },
  {
    name: 'daily',
    description: 'Nhận thưởng xu hằng ngày (1 lần/ngày)',
    module: 'built-in',
    aliases: [],
    parameters: [],
    builtIn: true,
    example: '!daily',
  },
  {
    name: 'sodu',
    description: 'Xem số dư xu minigame của bạn',
    module: 'built-in',
    aliases: ['balance'],
    parameters: [],
    builtIn: true,
    example: '!sodu',
  },
  {
    name: 'luatchoitaixiu',
    description: 'Xem luật chơi chi tiết của game Tài xỉu',
    module: 'built-in',
    aliases: ['luattaixiu'],
    parameters: [],
    builtIn: true,
    example: '!luatchoitaixiu',
  },
  {
    name: 'setRole',
    description: 'Thay đổi vai trò AI cho cuộc trò chuyện này (meow / assistant / reset)',
    module: 'built-in',
    aliases: ['role'],
    parameters: [
      {
        name: 'role',
        type: 'string',
        description: 'meow | assistant | reset (bỏ trống để xem role hiện tại)',
        required: false,
      },
    ],
    builtIn: true,
    example: '!setRole assistant',
  },
  {
    name: 'savemembers',
    description: 'Lưu toàn bộ danh sách thành viên nhóm (tên + ID) lên web (trang Bộ nhớ). Chỉ dùng trong nhóm.',
    module: 'built-in',
    aliases: ['luudanhsach', 'luuid'],
    parameters: [],
    builtIn: true,
    example: '!savemembers',
  },
  {
    name: 'searchid',
    description: 'Tìm ID Zalo của thành viên trong nhóm theo tên. Chỉ dùng trong nhóm.',
    module: 'built-in',
    aliases: ['timid', 'findid'],
    parameters: [
      {
        name: 'tên',
        type: 'string',
        description: 'Tên Zalo (một phần hoặc đầy đủ) của người cần tìm ID',
        required: true,
      },
    ],
    builtIn: true,
    example: '!searchid Nguyễn Văn A',
  },
];

function getModuleLabel(moduleName: string): string {
  if (moduleName === 'built-in') return 'Lệnh nhanh';
  return MODULE_LABELS[moduleName] ?? moduleName;
}

function getToolModuleMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const moduleName of moduleManager.getModuleNames()) {
    const mod = moduleManager.getModule(moduleName);
    for (const tool of mod?.tools ?? []) {
      map.set(tool.name, moduleName);
    }
  }
  return map;
}

function mapToolToCommand(tool: ITool, moduleName: string): CommandCatalogItem {
  return {
    name: tool.name,
    description: tool.description,
    module: moduleName,
    moduleLabel: getModuleLabel(moduleName),
    aliases: TOOL_ALIASES[tool.name] ?? [],
    parameters: tool.parameters ?? [],
    parameterCount: tool.parameters?.length ?? 0,
    builtIn: false,
    example: TOOL_EXAMPLES[tool.name],
    requiresApiKey: TOOL_REQUIRES_API[tool.name],
    disabled: isCommandDisabled(tool.name),
    role: getCommandRole(tool.name),
  };
}

function getBuiltInCommands(): CommandCatalogItem[] {
  return BUILT_IN_COMMANDS.map((item) => ({
    ...item,
    moduleLabel: getModuleLabel(item.module),
    parameterCount: item.parameters.length,
    disabled: isCommandDisabled(item.name),
    role: getCommandRole(item.name),
  }));
}

function groupCommandsByModule(commands: CommandCatalogItem[]): CommandCatalogModule[] {
  const grouped = new Map<string, CommandCatalogModule>();

  for (const cmd of commands) {
    const existing = grouped.get(cmd.module);
    if (!existing) {
      grouped.set(cmd.module, {
        module: cmd.module,
        moduleLabel: cmd.moduleLabel,
        count: 1,
        commands: [cmd],
      });
      continue;
    }
    existing.count += 1;
    existing.commands.push(cmd);
  }

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      commands: [...group.commands].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));
}

export function getCommandCatalogData(): CommandCatalogData {
  const builtIn = getBuiltInCommands();
  const toolModuleMap = getToolModuleMap();
  const tools = moduleManager
    .getAllTools()
    .map((tool) => mapToolToCommand(tool, toolModuleMap.get(tool.name) ?? 'unknown'))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byModule = groupCommandsByModule(tools);

  return {
    prefix: CONFIG.prefix,
    requirePrefix: CONFIG.requirePrefix,
    builtIn,
    tools,
    byModule,
    total: builtIn.length + tools.length,
  };
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function searchCommands(keyword: string): CommandCatalogItem[] {
  const needle = normalize(keyword);
  if (!needle) return [];

  const catalog = getCommandCatalogData();
  const allCommands = [...catalog.builtIn, ...catalog.tools];

  return allCommands.filter((cmd) => {
    if (normalize(cmd.name).includes(needle)) return true;
    if (normalize(cmd.description).includes(needle)) return true;
    if (normalize(cmd.moduleLabel).includes(needle)) return true;
    if (cmd.aliases.some((alias) => normalize(alias).includes(needle))) return true;
    return false;
  });
}

export function getCommandByName(name: string): CommandCatalogItem | null {
  const needle = normalize(name);
  if (!needle) return null;

  const catalog = getCommandCatalogData();
  const allCommands = [...catalog.builtIn, ...catalog.tools];

  return (
    allCommands.find((cmd) => {
      if (normalize(cmd.name) === needle) return true;
      return cmd.aliases.some((alias) => normalize(alias) === needle);
    }) ?? null
  );
}

export function getGameCommands(): CommandCatalogItem[] {
  const catalog = getCommandCatalogData();
  const tools = catalog.tools.filter((cmd) => {
    if (cmd.module === 'entertainment') return true;
    if (cmd.module === 'social' && cmd.name.toLowerCase().includes('poll')) return true;
    if (cmd.module === 'task' && cmd.name === 'solveMath') return true;
    return false;
  });
  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

function shorten(text: string, max = 88): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function buildCommandSignature(cmd: CommandCatalogItem): string {
  const params = cmd.parameters ?? [];
  if (params.length === 0) return `!${cmd.name}`;

  const argText = params
    .map((param) => (param.required ? `<${param.name}>` : `[${param.name}]`))
    .join(' ');
  return `!${cmd.name} ${argText}`.trim();
}

function sampleValueForType(type: ToolParameter['type']): string {
  switch (type) {
    case 'number':
      return '1';
    case 'boolean':
      return 'true';
    case 'object':
      return '{"key":"value"}';
    case 'string':
    default:
      return 'text';
  }
}

function buildCommandExample(cmd: CommandCatalogItem): string {
  const params = cmd.parameters ?? [];
  if (params.length === 0) return `!${cmd.name}`;

  const args = params
    .map((param) => {
      const sample = sampleValueForType(param.type);
      return param.required ? sample : `[${sample}]`;
    })
    .join(' ');

  return `!${cmd.name} ${args}`.trim();
}

function buildDetailedCommandText(cmd: CommandCatalogItem): string {
  const aliases =
    cmd.aliases.length > 0
      ? `• Alias: ${cmd.aliases.map((alias) => `!${alias}`).join(', ')}`
      : '• Alias: (không có)';

  const params = cmd.parameters ?? [];
  const paramLines =
    params.length > 0
      ? params.map((param) => {
          const required = param.required ? 'bắt buộc' : 'tùy chọn';
          return `• ${param.name} (${param.type}, ${required}): ${param.description}`;
        })
      : ['• Lệnh này không cần tham số.'];

  return [
    `📗 Chi tiết lệnh: !${cmd.name}`,
    '',
    `• Mô tả: ${cmd.description}`,
    `• Thuộc module: ${cmd.moduleLabel}`,
    aliases,
    '',
    '🧩 Cú pháp:',
    `• ${buildCommandSignature(cmd)}`,
    '',
    '📝 Tham số:',
    ...paramLines,
    '',
    '💡 Ví dụ:',
    `• ${buildCommandExample(cmd)}`,
  ].join('\n');
}

function buildCompactCatalogList(catalog: CommandCatalogData): string[] {
  const sections: string[] = [];

  const builtInNames = catalog.builtIn.map((cmd) => `!${cmd.name}`).join(', ');
  sections.push(`• Lệnh nhanh (${catalog.builtIn.length}): ${builtInNames}`);

  for (const group of catalog.byModule) {
    sections.push(`• ${group.moduleLabel}: ${group.count} lệnh`);
  }

  return sections;
}

function findCommandsByModule(moduleKeyword: string): CommandCatalogItem[] {
  const needle = normalize(moduleKeyword);
  const catalog = getCommandCatalogData();
  const modules = catalog.byModule.filter(
    (group) =>
      normalize(group.module).includes(needle) || normalize(group.moduleLabel).includes(needle),
  );

  return modules.flatMap((group) => group.commands);
}

function formatCompactLine(cmd: CommandCatalogItem): string {
  return `• ${buildCommandSignature(cmd)}: ${shorten(cmd.description, 78)}`;
}

export function buildHelpText(): string {
  const catalog = getCommandCatalogData();
  return [
    '📚 Lệnh nhanh',
    '',
    '• !help: Hướng dẫn nhanh',
    '• !command: Danh sách lệnh gọn + cách tra cứu',
    '• !command <tên_lệnh>: Xem chi tiết 1 lệnh',
    '• !command <từ_khóa>: Lọc lệnh theo tên/mô tả',
    '• !command module <tên_module>: Lọc theo module',
    '• !game: Danh sách minigame hiện có',
    '• !game taixiu: Mở hướng dẫn chơi Tài xỉu',
    '• !game taixiu cuoc <xu> <tai|xiu>: Đặt cược Tài xỉu',
    '• !luatchoitaixiu: Luật chơi Tài xỉu',
    '• !sodu: Xem số dư xu',
    '• !daily: Nhận thưởng xu hằng ngày',
    '',
    `🧰 Tổng lệnh khả dụng: ${catalog.total} (built-in: ${catalog.builtIn.length}, tools: ${catalog.tools.length})`,
    '',
    'Ví dụ:',
    '• !command google',
    '• !command module media',
    '• !command weather',
    '• !game taixiu cuoc 100 xiu',
  ].join('\n');
}

export function buildCommandListText(keyword?: string): string {
  const trimmed = (keyword ?? '').trim();
  const catalog = getCommandCatalogData();
  const allCommands = [...catalog.builtIn, ...catalog.tools];

  if (!trimmed) {
    return [
      `📘 Catalog lệnh: ${allCommands.length} lệnh`,
      '',
      '📌 Cách dùng:',
      '• !command <tên_lệnh>      → Xem chi tiết 1 lệnh',
      '• !command <từ_khóa>       → Lọc theo tên/mô tả/alias',
      '• !command module <tên>    → Lọc theo module',
      '• !game                    → Danh sách minigame',
      '',
      ...buildCompactCatalogList(catalog),
    ].join('\n');
  }

  const modulePrefix = /^module\s+(.+)$/i.exec(trimmed);
  if (modulePrefix?.[1]) {
    const moduleKeyword = modulePrefix[1].trim();
    const byModule = findCommandsByModule(moduleKeyword);
    if (byModule.length === 0) {
      return `🔎 Không tìm thấy module phù hợp với "${moduleKeyword}".`;
    }

    const maxItems = 30;
    const lines = byModule.slice(0, maxItems).map(formatCompactLine);
    const truncated =
      byModule.length > maxItems
        ? [``, `... và ${byModule.length - maxItems} lệnh khác trong module (lọc thêm từ khóa để gọn hơn).`]
        : [];

    return [
      `📂 Lệnh theo module "${moduleKeyword}" (${byModule.length})`,
      '',
      ...lines,
      ...truncated,
      '',
      '💡 Gợi ý: !command <tên_lệnh> để xem hướng dẫn chi tiết.',
    ].join('\n');
  }

  const commands = searchCommands(trimmed);
  if (commands.length === 0) {
    return `🔎 Không tìm thấy lệnh nào với từ khóa "${trimmed}".`;
  }

  const exactCommand = getCommandByName(trimmed);
  if (exactCommand) {
    return buildDetailedCommandText(exactCommand);
  }

  const header = trimmed
    ? `📘 Danh sách lệnh (lọc: "${trimmed}") - ${commands.length} kết quả`
    : `📘 Danh sách lệnh hiện có: ${commands.length}`;

  const maxItems = 24;
  const lines = commands.slice(0, maxItems).map(formatCompactLine);
  const truncated =
    commands.length > maxItems
      ? [``, `... và ${commands.length - maxItems} lệnh khác (lọc thêm từ khóa để gọn hơn).`]
      : [];

  return [
    header,
    '',
    ...lines,
    ...truncated,
    '',
    '💡 Gợi ý: dùng !command <tên_lệnh> để xem cú pháp chi tiết của từng lệnh.',
  ].join('\n');
}

export function buildGameListText(keyword?: string): string {
  const query = (keyword ?? '').trim();
  const normalizedQuery = normalize(query);

  if (!query) {
    return [
      '🎮 Danh sách minigame hiện có',
      '',
      '1. Tài xỉu',
      '• Bắt đầu: !game taixiu',
      '• Cược: !game taixiu cuoc <so_xu> <tai|xiu>',
      '• Luật: !luatchoitaixiu',
      '',
      '💰 Lệnh ví xu:',
      '• !sodu',
      '• !daily',
    ].join('\n');
  }

  if (normalizedQuery === 'taixiu' || normalizedQuery === 'tx') {
    return [
      '🎲 Tài xỉu',
      '',
      '• Cược tối thiểu: 100 xu',
      '• Cú pháp cược: !game taixiu cuoc <so_xu> <tai|xiu>',
      '• Ví dụ: !game taixiu cuoc 100 xiu',
      '• Luật chi tiết: !luatchoitaixiu',
      '• Số dư: !sodu | Nhận xu ngày: !daily',
    ].join('\n');
  }

  return `🎮 Chưa có game "${query}". Hiện chỉ có: taixiu.`;
}
