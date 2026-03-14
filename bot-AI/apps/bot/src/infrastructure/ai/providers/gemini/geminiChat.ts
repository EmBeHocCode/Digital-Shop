/**
 * Gemini Chat - Quản lý chat sessions
 */
import type { Chat, Content, Part } from '@google/genai';
import { CONFIG } from '../../../../core/config/config.js';
import { debugLog } from '../../../../core/logger/logger.js';
import { fetchAsBase64 } from '../../../../shared/utils/httpClient.js';
import {
  GEMINI_CONFIG,
  getAI,
  getGeminiModel,
  keyManager,
  type MediaPart,
} from './geminiConfig.js';
import { getSystemPrompt } from './prompts.js';
import { getThreadUseCharacter } from './roleStore.js';

// Chat session storage
const chatSessions = new Map<string, Chat>();
const sessionPrompts = new Map<string, string>();

/**
 * Lấy SYSTEM_PROMPT cho thread (per-thread role override hoặc global config)
 */
export function getThreadPrompt(threadId: string): string {
  const threadUseChar = getThreadUseCharacter(threadId);
  const useChar = threadUseChar !== undefined ? threadUseChar : CONFIG.useCharacter;
  return getSystemPrompt(useChar);
}

/**
 * Lấy hoặc tạo chat session cho thread
 * Sử dụng getAI() để lấy instance với key hiện tại
 */
export function getChatSession(threadId: string, history?: Content[]): Chat {
  let chat = chatSessions.get(threadId);
  const currentPrompt = getThreadPrompt(threadId);

  // Nếu system prompt thay đổi (web settings update hoặc !setRole), recreate session
  if (chat && sessionPrompts.get(threadId) !== currentPrompt) {
    chatSessions.delete(threadId);
    sessionPrompts.delete(threadId);
    chat = undefined;
    debugLog('GEMINI', `System prompt changed, recreating chat session for thread ${threadId}`);
  }

  if (!chat) {
    const model = getGeminiModel();
    debugLog(
      'GEMINI',
      `Creating new chat session for thread ${threadId} with key #${keyManager.getCurrentKeyIndex()}, model=${model}`,
    );
    chat = getAI().chats.create({
      model,
      config: {
        ...GEMINI_CONFIG,
        systemInstruction: currentPrompt,
      },
      history: history || [],
    });
    chatSessions.set(threadId, chat);
    sessionPrompts.set(threadId, currentPrompt);
  }

  return chat;
}

/**
 * Force tạo mới chat session (dùng khi rotate key)
 */
export function recreateChatSession(threadId: string, history?: Content[]): Chat {
  chatSessions.delete(threadId);
  return getChatSession(threadId, history);
}

/**
 * Xóa chat session
 */
export function deleteChatSession(threadId: string): void {
  chatSessions.delete(threadId);
  sessionPrompts.delete(threadId);
}

/**
 * Build message parts từ prompt và media
 */
export async function buildMessageParts(prompt: string, media?: MediaPart[]): Promise<Part[]> {
  const parts: Part[] = [{ text: prompt }];

  if (!media || media.length === 0) {
    return parts;
  }

  for (const item of media) {
    try {
      if (item.type === 'youtube' && item.url) {
        parts.push({ fileData: { fileUri: item.url, mimeType: 'video/mp4' } });
        debugLog('GEMINI', `Added YouTube: ${item.url}`);
      } else if (item.base64) {
        parts.push({
          inlineData: {
            data: item.base64,
            mimeType: item.mimeType || 'application/octet-stream',
          },
        });
        debugLog('GEMINI', `Added pre-converted: ${item.mimeType}`);
      } else if (item.url) {
        const base64Data = await fetchAsBase64(item.url);
        if (base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: item.mimeType || 'application/octet-stream',
            },
          });
          debugLog('GEMINI', `Loaded ${item.type}: ${item.mimeType}`);
        }
      }
    } catch (e) {
      debugLog('GEMINI', `Error loading ${item.type}: ${e}`);
    }
  }

  return parts;
}

/**
 * Check if error is retryable (503, 429, etc.)
 */
export function isRetryableError(error: any): boolean {
  const status = error?.status || error?.code;
  return CONFIG.retry.retryableStatusCodes.includes(status);
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
