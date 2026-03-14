/**
 * Logger Module - Pino-based structured logging
 * Production: cache logs in memory, send via registered transport
 * Development: log to console + file with rotation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Writable } from 'node:stream';
import pino from 'pino';
import { formatFileTimestamp, now } from '../../shared/utils/datetime.js';
import {
  flushLogs,
  getLogCacheSize as getCacheSize,
  type ILogTransport,
  ProductionLogStream,
  registerLogTransport,
} from './transports.js';

let logger: pino.Logger;
let sessionDir: string = '';
let fileLoggingEnabled = false;
let maxLinesPerFile = 1000; // Default, will be updated from config
let sessionIntervalHours = 5; // Mỗi bao nhiêu giờ thì tạo bucket log mới
let maxSessionFolders = 100; // Giữ tối đa bao nhiêu thư mục log session

// Re-export transport functions
export { registerLogTransport, type ILogTransport };
export { flushLogs as forceFlushLogs } from './transports.js';
export const getLogCacheSize = getCacheSize;

/**
 * Tạo timestamp cho tên thư mục
 */
function getTimestamp(): string {
  const now = new Date();
  const bucketHour = Math.floor(now.getHours() / sessionIntervalHours) * sessionIntervalHours;
  now.setHours(bucketHour, 0, 0, 0);
  return formatFileTimestamp(now);
}

/**
 * Dọn các session log cũ nếu vượt ngưỡng
 */
function cleanupOldSessions(logsRoot: string): void {
  if (maxSessionFolders < 1 || !fs.existsSync(logsRoot)) return;

  const directories = fs
    .readdirSync(logsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(logsRoot, entry.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(fullPath).mtimeMs;
      } catch {
        mtimeMs = 0;
      }
      return {
        name: entry.name,
        fullPath,
        mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (directories.length <= maxSessionFolders) return;

  const toDelete = directories.slice(maxSessionFolders);
  let deleted = 0;

  for (const dir of toDelete) {
    try {
      fs.rmSync(dir.fullPath, { recursive: true, force: true });
      deleted++;
    } catch (error) {
      console.warn(`[Logger] Failed to delete old log session "${dir.name}":`, error);
    }
  }

  if (deleted > 0) {
    console.log(`[Logger] Cleaned ${deleted} old log session(s), kept latest ${maxSessionFolders}`);
  }
}

/**
 * Custom writable stream với log rotation theo số dòng (development)
 */
class RotatingFileStream extends Writable {
  private basePath: string;
  private currentFile: string;
  private lineCount: number = 0;
  private fileIndex: number = 0;
  private writeStream: fs.WriteStream | null = null;

  constructor(basePath: string) {
    super();
    this.basePath = basePath;
    this.currentFile = this.getFileName(0);
    this.initStream();
  }

  private getFileName(index: number): string {
    const ext = path.extname(this.basePath);
    const base = this.basePath.slice(0, -ext.length);
    return index === 0 ? this.basePath : `${base}_${index}${ext}`;
  }

  private initStream(): void {
    if (fs.existsSync(this.currentFile)) {
      const content = fs.readFileSync(this.currentFile, 'utf-8');
      this.lineCount = content.split('\n').filter((line) => line.trim()).length;

      while (this.lineCount >= maxLinesPerFile) {
        this.fileIndex++;
        this.currentFile = this.getFileName(this.fileIndex);
        if (fs.existsSync(this.currentFile)) {
          const content = fs.readFileSync(this.currentFile, 'utf-8');
          this.lineCount = content.split('\n').filter((line) => line.trim()).length;
        } else {
          this.lineCount = 0;
        }
      }
    }

    this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
  }

  private rotate(): void {
    if (this.writeStream) {
      this.writeStream.end();
    }
    this.fileIndex++;
    this.currentFile = this.getFileName(this.fileIndex);
    this.lineCount = 0;
    this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
  }

  _write(chunk: Buffer, _encoding: string, callback: (error?: Error | null) => void): void {
    const data = chunk.toString();
    const lines = data.split('\n').filter((line) => line.trim()).length;

    if (this.lineCount + lines > maxLinesPerFile) {
      this.rotate();
    }

    this.lineCount += lines;
    this.writeStream?.write(chunk, callback);
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.writeStream) {
      this.writeStream.end(callback);
    } else {
      callback();
    }
  }
}

/**
 * Khởi tạo Pino logger
 * Production: console + file rotation + cache (gửi qua transport)
 * Development: console + file rotation
 */
export function initFileLogger(basePath: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const streams: pino.StreamEntry[] = [];

  // Console output (pretty) - luôn có
  streams.push({
    level: (process.env.LOG_LEVEL || 'info') as pino.Level,
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: !isProduction,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }),
  });

  // File logging - cả production và development đều ghi file
  const logsRoot = path.dirname(basePath);

  if (!fs.existsSync(logsRoot)) {
    fs.mkdirSync(logsRoot, { recursive: true });
  }

  cleanupOldSessions(logsRoot);

  sessionDir = path.join(logsRoot, getTimestamp());
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const logFile = path.join(sessionDir, 'bot.txt');
  const rotatingStream = new RotatingFileStream(logFile);

  streams.push({
    level: 'debug',
    stream: rotatingStream,
  });

  if (isProduction) {
    // Production: thêm cache stream để gửi qua transport (API realtime)
    streams.push({
      level: 'debug',
      stream: new ProductionLogStream(),
    });
    console.log('📝 Production mode: logs written to file + sent via transport');
  }

  logger = pino(
    {
      level: 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(streams),
  );

  logger.info(
    { session: sessionDir, env: isProduction ? 'production' : 'development' },
    '🚀 Bot started',
  );
}

/**
 * Lấy session directory
 */
export function getSessionDir(): string {
  return sessionDir;
}

/**
 * Enable file logging (compatibility)
 */
export function enableFileLogging(): void {
  fileLoggingEnabled = true;
}

export function isFileLoggingEnabled(): boolean {
  return fileLoggingEnabled;
}

/**
 * Set logger config from settings.json
 */
export function setLoggerConfig(config: {
  maxLinesPerFile?: number;
  sessionIntervalHours?: number;
  maxSessionFolders?: number;
}): void {
  if (typeof config.maxLinesPerFile === 'number' && config.maxLinesPerFile > 0) {
    maxLinesPerFile = Math.floor(config.maxLinesPerFile);
  }
  if (typeof config.sessionIntervalHours === 'number' && Number.isFinite(config.sessionIntervalHours)) {
    sessionIntervalHours = Math.max(1, Math.min(24, Math.floor(config.sessionIntervalHours)));
  }
  if (typeof config.maxSessionFolders === 'number' && Number.isFinite(config.maxSessionFolders)) {
    maxSessionFolders = Math.max(1, Math.floor(config.maxSessionFolders));
  }
}

/**
 * Close logger (compatibility)
 */
export function closeFileLogger(): void {
  // Flush remaining logs in production
  if (process.env.NODE_ENV === 'production') {
    flushLogs().catch(console.error);
  }
}

// ═══════════════════════════════════════════════════
// LOGGING FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Debug log với category
 */
export function debugLog(category: string, ...args: any[]): void {
  if (!logger) return;
  const message = args
    .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ');
  logger.debug({ category }, message);
}

/**
 * Log tin nhắn IN/OUT
 */
export function logMessage(direction: 'IN' | 'OUT', threadId: string, data: any): void {
  if (!logger) return;
  logger.info({ direction, threadId, data }, `Message ${direction}`);
}

/**
 * Log step trong flow
 */
export function logStep(step: string, details?: any): void {
  if (!logger) return;
  logger.info({ step, details }, `>>> ${step}`);
}

/**
 * Log API call
 */
export function logAPI(service: string, action: string, request?: any, response?: any): void {
  if (!logger) return;
  logger.debug({ service, action, request, response }, `API: ${service}`);
}

/**
 * Log AI response
 */
export function logAIResponse(prompt: string, rawResponse: string): void {
  if (!logger) return;
  logger.debug(
    {
      prompt: prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''),
      response: rawResponse,
    },
    'AI Response',
  );
}

/**
 * Log error
 */
export function logError(context: string, error: any): void {
  if (!logger) {
    console.error(`[${context}]`, error);
    return;
  }
  logger.error(
    {
      context,
      err: {
        message: error?.message || String(error),
        stack: error?.stack,
      },
    },
    `Error in ${context}`,
  );
}

/**
 * Log AI history (ghi file cả production và development)
 */
export function logAIHistory(threadId: string, history: any[]): void {
  if (!logger) return;

  logger.debug({ threadId, messageCount: history.length }, 'AI History updated');

  // Ghi file nếu có sessionDir (cả production và development)
  if (!sessionDir) return;

  const historyFile = path.join(sessionDir, `history_${threadId}.json`);
  const data = {
    threadId,
    updatedAt: now(),
    messageCount: history.length,
    history: history.map((content, index) => {
      const processedParts = content.parts?.map((part: any) => {
        if (part.inlineData?.data) {
          return {
            ...part,
            inlineData: {
              ...part.inlineData,
              data: `${part.inlineData.data.substring(0, 100)}...[truncated]`,
            },
          };
        }
        return part;
      });
      return {
        index,
        role: content.role,
        parts: processedParts || content.parts,
      };
    }),
  };
  fs.writeFileSync(historyFile, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Log Zalo API
 */
export function logZaloAPI(action: string, request: any, response?: any, error?: any): void {
  if (!logger) return;

  if (error) {
    logger.error({ action, request, error: error?.message || error }, `ZALO: ${action} ERROR`);
  } else {
    logger.debug({ action, request, response }, `ZALO: ${action}`);
  }
}

/**
 * Log system prompt (ghi file cả production và development)
 */
export function logSystemPrompt(threadId: string, systemPrompt: string): void {
  if (!logger) return;

  logger.debug({ threadId }, 'System prompt set');

  // Ghi file nếu có sessionDir (cả production và development)
  if (!sessionDir) return;

  const promptFile = path.join(sessionDir, `system_prompt_${threadId}.txt`);
  const promptData = `Thread: ${threadId}\nTimestamp: ${now()}\n${'='.repeat(80)}\n\n${systemPrompt}`;
  fs.writeFileSync(promptFile, promptData, 'utf-8');
}

// ═══════════════════════════════════════════════════
// DIRECT PINO ACCESS
// ═══════════════════════════════════════════════════

/**
 * Get raw Pino logger instance
 */
export function getLogger(): pino.Logger | undefined {
  return logger;
}

/**
 * Create child logger with bindings
 */
export function createChildLogger(bindings: Record<string, any>): pino.Logger | undefined {
  return logger?.child(bindings);
}
