import { Hono } from 'hono';
import { z } from 'zod';
import {
  deleteChatSession,
  getChatSession,
  isRateLimitError,
  keyManager,
  parseAIResponse,
} from '../ai/index.js';
import { CONFIG } from '../../core/config/config.js';
import {
  executeAllTools,
  parseToolCalls,
  type ToolCall,
  type ToolResult,
} from '../../core/index.js';
import { DEFAULT_RESPONSE } from '../../shared/types/config.schema.js';
import { buildChatStyleHint, normalizeSlang } from '../../shared/utils/chat_style.js';
import { buildRealtimeTimeHolidayContext } from '../../shared/utils/realtimeTimeHoliday.js';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Tin nhắn không được để trống').max(8000, 'Tin nhắn quá dài'),
  sessionId: z.string().min(1).max(120).optional(),
  reset: z.boolean().optional(),
});

function normalizeSessionId(input?: string): string {
  const raw = (input || 'default').trim();
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'default';
}

function stripBotTags(text: string): string {
  return text
    .replace(/\[reaction:(\d+:)?\w+\]/gi, '')
    .replace(/\[sticker:\w+\]/gi, '')
    .replace(/\[quote:-?\d+\]([\s\S]*?)\[\/quote\]/gi, '$1')
    .replace(/\[msg\]([\s\S]*?)\[\/msg\]/gi, '$1')
    .replace(/\[undo:-?\d+\]/gi, '')
    .replace(/\[card(?::\d+)?\]/gi, '')
    .replace(/\[tool:\w+(?:\s+[^\]]*?)?\](?:\s*\{[\s\S]*?\}\s*\[\/tool\])?/gi, '')
    .replace(/\[tool_result:[^\]]+\][\s\S]*?\[\/tool_result\]/gi, '')
    .trim();
}

function isDefaultFallback(text: string, reactions: string[]): boolean {
  const defaultText = DEFAULT_RESPONSE.messages[0]?.text || '';
  const defaultReaction = DEFAULT_RESPONSE.reactions[0] || '';
  return (
    text === defaultText &&
    reactions.length === DEFAULT_RESPONSE.reactions.length &&
    reactions[0] === defaultReaction
  );
}

function buildWebChatPrompt(rawMessage: string): string {
  const raw = rawMessage.trim();
  const normalized = normalizeSlang(raw);
  const styleHint = buildChatStyleHint(raw);
  const realtimeContext = buildRealtimeTimeHolidayContext(raw);

  if (!styleHint) {
    return `[WEB CHAT CONTEXT]
- Channel: web-chat
- RawUserText: ${raw}
- NormalizedUserText: ${normalized || raw}

${realtimeContext}

[USER MESSAGE]
${normalized || raw}`;
  }

  return `[WEB CHAT CONTEXT]
- Channel: web-chat
- RawUserText: ${raw}
- NormalizedUserText: ${normalized || raw}

${realtimeContext}

[CHAT STYLE CONTEXT]
${styleHint}

[USER MESSAGE]
${normalized || raw}`;
}

function sanitizeToolData(data: unknown): unknown {
  const seen = new WeakSet<object>();

  const walk = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.slice(0, 12).map((item) => walk(item));
    }
    if (typeof value !== 'object') return String(value);

    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    const raw = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(raw)) {
      if (key === 'imageBuffers' && Array.isArray(item)) {
        out.imagesGenerated = item.length;
        continue;
      }
      if (key === 'fileBuffer' && Buffer.isBuffer(item)) {
        out.fileBytes = item.length;
        continue;
      }
      if (key === 'imageBuffer' && Buffer.isBuffer(item)) {
        out.imageBytes = item.length;
        continue;
      }
      if (key === 'audio' && Buffer.isBuffer(item)) {
        out.audioBytes = item.length;
        continue;
      }
      if (key === 'audioBase64' && typeof item === 'string') {
        out.audioBase64 = '[omitted]';
        continue;
      }
      out[key] = walk(item);
    }

    return out;
  };

  return walk(data);
}

function formatToolResultForAI(toolCall: ToolCall, result: ToolResult): string {
  if (result.success) {
    const cleanData = sanitizeToolData(result.data ?? {});
    return `[tool_result:${toolCall.toolName}]
Kết quả thành công:
${JSON.stringify(cleanData, null, 2)}
[/tool_result]`;
  }

  return `[tool_result:${toolCall.toolName}]
Lỗi: ${result.error || 'Tool execution failed'}
[/tool_result]`;
}

function formatAllToolResults(toolCalls: ToolCall[], results: Map<string, ToolResult>): string {
  const parts: string[] = [];
  for (const call of toolCalls) {
    const result = results.get(call.rawTag);
    if (result) {
      parts.push(formatToolResultForAI(call, result));
    }
  }

  return `${parts.join('\n\n')}

Dựa trên kết quả tool ở trên, hãy trả lời user một cách tự nhiên bằng tiếng Việt. Không hiển thị tag [tool] hoặc [tool_result].`;
}

async function resolveWebChatToolCalls(chat: ReturnType<typeof getChatSession>, rawText: string, threadId: string): Promise<string> {
  let currentText = rawText.trim();
  const maxRounds = 3;

  for (let round = 0; round < maxRounds; round++) {
    const toolCalls = parseToolCalls(currentText);
    if (toolCalls.length === 0) break;

    const toolContext = {
      api: null,
      threadId,
      senderId: CONFIG.adminUserId || 'web-dashboard',
      senderName: 'Web Dashboard',
    };

    const results = await executeAllTools(toolCalls, toolContext);
    const followUpPrompt = formatAllToolResults(toolCalls, results);
    const followUp = await chat.sendMessage({ message: followUpPrompt });
    currentText = (followUp.text || '').trim();
    if (!currentText) break;
  }

  return currentText;
}

export const chatApi = new Hono();

chatApi.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: 'Dữ liệu không hợp lệ', details: parsed.error.issues }, 400);
    }

    const { message, sessionId, reset } = parsed.data;
    const normalizedSession = normalizeSessionId(sessionId);
    const threadId = `webchat-${normalizedSession}`;

    if (reset) {
      deleteChatSession(threadId);
    }

    let lastError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const chat = getChatSession(threadId);
        const promptMessage = buildWebChatPrompt(message);
        const response = await chat.sendMessage({ message: promptMessage });
        const initialRawText = (response.text || '').trim();
        const rawText = await resolveWebChatToolCalls(chat, initialRawText, threadId);
        const parsedResponse = parseAIResponse(rawText);
        const parsedText = parsedResponse.messages
          .map((item) => item.text?.trim() || '')
          .filter(Boolean)
          .join('\n\n')
          .trim();

        const reply = !parsedText || isDefaultFallback(parsedText, parsedResponse.reactions)
          ? stripBotTags(rawText)
          : parsedText;

        return c.json({
          success: true,
          data: {
            sessionId: normalizedSession,
            reply: reply || 'Bot chưa có phản hồi rõ ràng, bạn thử nhắn lại nhé.',
            reactions: parsedResponse.reactions,
          },
        });
      } catch (error) {
        lastError = error;
        if (isRateLimitError(error)) {
          const rotated = keyManager.handleRateLimitError();
          if (rotated) {
            deleteChatSession(threadId);
            continue;
          }
        }
        break;
      }
    }

    const messageText = lastError instanceof Error ? lastError.message : 'Không thể tạo phản hồi';
    return c.json({ success: false, error: messageText }, 500);
  } catch (error) {
    return c.json(
      { success: false, error: `Lỗi chat API: ${(error as Error).message}` },
      500,
    );
  }
});

chatApi.delete('/:sessionId', (c) => {
  const normalizedSession = normalizeSessionId(c.req.param('sessionId'));
  const threadId = `webchat-${normalizedSession}`;
  deleteChatSession(threadId);

  return c.json({
    success: true,
    data: {
      sessionId: normalizedSession,
    },
    message: 'Đã xóa phiên chat web.',
  });
});
