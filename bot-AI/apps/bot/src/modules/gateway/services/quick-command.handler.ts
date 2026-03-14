import {
  buildCommandListText,
  buildGameListText,
  buildHelpText,
} from '../../../infrastructure/commands/commands.catalog.js';
import {
  AVAILABLE_ROLES,
  clearThreadRole,
  getThreadRoleLabel,
  setThreadRole,
  type ThreadRole,
} from '../../../infrastructure/ai/providers/gemini/roleStore.js';
import { groupMembersCache } from '../../social/tools/getGroupMembers.js';
import { memoryStore } from '../../../infrastructure/memory/index.js';

export interface QuickCommandResult {
  handled: boolean;
  responseText?: string;
}

function parseInput(text: string): { command: string; args: string; hasBang: boolean } {
  const trimmed = text.trim();
  const hasBang = trimmed.startsWith('!');
  const withoutBang = hasBang ? trimmed.slice(1).trim() : trimmed;
  const [rawCommand, ...rest] = withoutBang.split(/\s+/);
  return {
    command: (rawCommand ?? '').toLowerCase(),
    args: rest.join(' ').trim(),
    hasBang,
  };
}

function handleSetRole(args: string, threadId?: string): QuickCommandResult {
  if (!threadId) {
    return { handled: true, responseText: '❌ Không xác định được cuộc trò chuyện.' };
  }

  if (!args) {
    const currentLabel = getThreadRoleLabel(threadId);
    const roleList = AVAILABLE_ROLES.map((r) => `• !setRole ${r.key} - ${r.label}`).join('\n');
    return {
      handled: true,
      responseText:
        `🎭 Role AI hiện tại: ${currentLabel}\n\n` +
        `📋 Danh sách roles:\n${roleList}\n\n` +
        `💡 Ví dụ: !setRole meow`,
    };
  }

  const key = args.toLowerCase().trim();

  if (key === 'reset' || key === 'default' || key === 'mặcđịnh') {
    clearThreadRole(threadId);
    return { handled: true, responseText: '↩️ Đã reset về role mặc định (theo cài đặt hệ thống). AI sẽ áp dụng từ tin nhắn tiếp theo.' };
  }

  const found = AVAILABLE_ROLES.find((r) => r.key === key && r.role !== null);
  if (found && found.role) {
    setThreadRole(threadId, found.role as ThreadRole);
    return { handled: true, responseText: `✅ Đã chuyển sang ${found.label}!\nAI sẽ áp dụng từ tin nhắn tiếp theo.` };
  }

  const validKeys = AVAILABLE_ROLES.map((r) => `!setRole ${r.key}`).join(' | ');
  return { handled: true, responseText: `❌ Role không hợp lệ: "${args}"\n\nDùng: ${validKeys}` };
}

export async function handleQuickCommand(
  text: string,
  allowBare = false,
  threadId?: string,
  api?: any,
  isGroup = false,
): Promise<QuickCommandResult> {
  const { command, args, hasBang } = parseInput(text);
  if (!command) return { handled: false };
  if (!hasBang && !allowBare) return { handled: false };

  if (command === 'help' || command === 'h' || command === '?') {
    return { handled: true, responseText: buildHelpText() };
  }

  if (command === 'command' || command === 'commands' || command === 'cmd') {
    return { handled: true, responseText: buildCommandListText(args) };
  }

  if (command === 'game' || command === 'games') {
    return { handled: true, responseText: buildGameListText(args) };
  }

  if (command === 'setrole' || command === 'role') {
    return handleSetRole(args, threadId);
  }

  if (command === 'searchid' || command === 'timid' || command === 'findid') {
    return handleSearchId(args, threadId, api, isGroup);
  }

  if (command === 'savemembers' || command === 'luudanhsach' || command === 'luuid') {
    return handleSaveMembers(threadId, api, isGroup);
  }

  return { handled: false };
}

async function handleSaveMembers(
  threadId: string | undefined,
  api: any,
  isGroup: boolean,
): Promise<QuickCommandResult> {
  if (!threadId) return { handled: true, responseText: '❌ Không xác định được cuộc trò chuyện.' };
  if (!isGroup) return { handled: true, responseText: '⚠️ Lệnh !savemembers chỉ dùng được trong nhóm.' };
  if (!api) return { handled: true, responseText: '❌ Bot chưa kết nối Zalo API.' };

  try {
    // Lấy member list — ưu tiên cache
    let members = groupMembersCache.get(threadId);
    let groupName = 'Nhóm không rõ tên';

    if (!members) {
      const groupInfo = await api.getGroupInfo(threadId);
      const info = groupInfo?.gridInfoMap?.[threadId];

      if (!info) return { handled: true, responseText: '❌ Không lấy được thông tin nhóm.' };

      groupName = info.name || groupName;
      const adminIds: string[] = info.adminIds || [];
      const creatorId: string = info.creatorId || '';
      const rawMembers: any[] = info.currentMems || info.members || [];

      if (rawMembers.length === 0 || !rawMembers[0]?.id) {
        return {
          handled: true,
          responseText:
            '⚠️ Dữ liệu tên thành viên chưa được tải.\n' +
            'Dùng !getGroupMembers trước để bot tải danh sách, rồi thử lại.',
        };
      }

      members = rawMembers.map((m: any) => {
        let role = 'Member';
        if (m.id === creatorId) role = 'Creator';
        else if (adminIds.includes(m.id)) role = 'Admin';
        return { name: m.dName || m.zaloName || m.displayName || 'Không tên', id: String(m.id), role };
      });
      groupMembersCache.set(threadId, members);
    } else {
      // Lấy tên nhóm từ API (nhẹ, không lấy lại member)
      try {
        const gi = await api.getGroupInfo(threadId);
        groupName = gi?.gridInfoMap?.[threadId]?.name || groupName;
      } catch { /* ignore */ }
    }

    const now = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const lines = members
      .map((m) => `${m.name} | ${m.id} | ${m.role}`)
      .join('\n');

    const content =
      `[Danh sách thành viên nhóm] "${groupName}" — ${members.length} người (${now})\n` +
      `Thread ID: ${threadId}\n\n` +
      lines;

    const memId = await memoryStore.add(content, {
      importance: 8,
      metadata: {
        type: 'group_members',
        threadId,
        groupName,
        count: members.length,
        savedAt: new Date().toISOString(),
      },
    });

    return {
      handled: true,
      responseText:
        `✅ Đã lưu danh sách ${members.length} thành viên nhóm "${groupName}" lên web!\n` +
        `📋 Memory #${memId} — Xem tại: Dashboard → Bộ nhớ`,
    };
  } catch (e: any) {
    return { handled: true, responseText: `❌ Lỗi lưu danh sách: ${e.message}` };
  }
}

async function handleSearchId(
  args: string,
  threadId: string | undefined,
  api: any,
  isGroup: boolean,
): Promise<QuickCommandResult> {
  if (!threadId) return { handled: true, responseText: '❌ Không xác định được cuộc trò chuyện.' };
  if (!isGroup) return { handled: true, responseText: '⚠️ Lệnh !searchid chỉ dùng được trong nhóm.' };

  const keyword = args.trim();
  if (!keyword) {
    return {
      handled: true,
      responseText:
        '💡 Cú pháp: !searchid <tên>\n' +
        'Ví dụ: !searchid Nguyễn Văn A\n\n' +
        'Bot sẽ tìm thành viên nhóm có tên khớp và trả về ID của họ.',
    };
  }

  if (!api) return { handled: true, responseText: '❌ Bot chưa kết nối Zalo API.' };

  try {
    const lower = keyword.toLowerCase();

    // Dùng cache nếu đã có
    let members = groupMembersCache.get(threadId);

    if (!members) {
      const groupInfo = await api.getGroupInfo(threadId);
      const info = groupInfo?.gridInfoMap?.[threadId];

      if (!info) {
        return { handled: true, responseText: '❌ Không lấy được thông tin nhóm.' };
      }

      const adminIds: string[] = info.adminIds || [];
      const creatorId: string = info.creatorId || '';
      const rawMembers: any[] = info.currentMems || info.members || [];

      if (rawMembers.length > 0 && rawMembers[0]?.id) {
        members = rawMembers.map((m: any) => {
          let role = 'Member';
          if (m.id === creatorId) role = 'Creator';
          else if (adminIds.includes(m.id)) role = 'Admin';
          return {
            name: m.dName || m.zaloName || m.displayName || 'Không tên',
            id: String(m.id),
            role,
          };
        });
        // Lưu vào cache
        groupMembersCache.set(threadId, members);
      } else {
        return {
          handled: true,
          responseText:
            '⚠️ Dữ liệu tên thành viên chưa được tải.\n' +
            'Dùng !getGroupMembers trước để bot tải danh sách, rồi thử lại.',
        };
      }
    }

    const found = members.filter((m) => m.name.toLowerCase().includes(lower));

    if (found.length === 0) {
      return {
        handled: true,
        responseText:
          `🔍 Không tìm thấy thành viên nào có tên chứa "${keyword}".\n\n` +
          `Gợi ý: Thử tên ngắn hơn hoặc dùng !getGroupMembers để tải lại danh sách mới nhất.`,
      };
    }

    const lines = found
      .map((m) => `• ${m.name}\n  🆔 ${m.id}  [${m.role}]`)
      .join('\n');

    return {
      handled: true,
      responseText: `🔍 Tìm thấy ${found.length} thành viên khớp "${keyword}":\n\n${lines}`,
    };
  } catch (e: any) {
    return { handled: true, responseText: `❌ Lỗi tìm kiếm: ${e.message}` };
  }
}
