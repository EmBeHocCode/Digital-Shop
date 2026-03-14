/**
 * Bot Process Manager - Singleton quản lý tiến trình bot
 * Chạy server-side only trong Next.js
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { existsSync, readdirSync } from 'node:fs';

// Bot directory - relative from web app or override via env
const BOT_DIR =
  process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');

const DEFAULT_BOT_PORT = '10000';

function getBotPort(): string {
  if (process.env.BOT_PORT) return process.env.BOT_PORT;

  const apiUrl = process.env.BOT_API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.port) return parsed.port;
    } catch {
      // Ignore invalid URL and fallback to default.
    }
  }

  return DEFAULT_BOT_PORT;
}

async function isBotApiAlive(): Promise<boolean> {
  const port = getBotPort();
  const endpoints = [`http://127.0.0.1:${port}/health`, `http://localhost:${port}/health`];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 401 || res.status === 403) return true;
    } catch {
      // try next endpoint
    }
  }

  return false;
}

// Bun executable path
function getBunPath(): string {
  if (process.env.BUN_PATH && existsSync(process.env.BUN_PATH)) return process.env.BUN_PATH;

  if (process.platform === 'win32') {
    const userHome = process.env.USERPROFILE;
    if (userHome) {
      const fromUserProfile = path.join(userHome, '.bun', 'bin', 'bun.exe');
      if (existsSync(fromUserProfile)) return fromUserProfile;
    }

    // Service account có thể là systemprofile (không có bun). Thử tìm trong C:\Users\*\.
    try {
      const userDirs = readdirSync('C:\\Users', { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const dir of userDirs) {
        const candidate = path.join('C:\\Users', dir.name, '.bun', 'bin', 'bun.exe');
        if (existsSync(candidate)) return candidate;
      }
    } catch {
      // ignore and fallback below
    }

    // Fallback cuối cùng: dựa vào PATH.
    return 'bun.exe';
  }
  return 'bun';
}

// Strip ANSI escape codes
function stripAnsi(str: string): string {
  // biome-ignore lint: regex for ansi codes
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '').replace(/\x1B\[\??\d+[hlm]/g, '');
}

export type BotStatus = 'running' | 'stopped' | 'starting' | 'stopping';

export interface LogLine {
  id: number;
  time: string;
  text: string;
  type: 'stdout' | 'stderr' | 'system';
}

const MAX_LOG_BUFFER = 1000;
let logIdCounter = 0;

class BotManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private logs: LogLine[] = [];
  private _status: BotStatus = 'stopped';
  private startTime: number | null = null;

  constructor() {
    super();
    this.setMaxListeners(200);
  }

  get status(): BotStatus {
    return this._status;
  }

  getLogs(): LogLine[] {
    return [...this.logs];
  }

  private addLog(text: string, type: LogLine['type'] = 'stdout') {
    const cleaned = stripAnsi(text).trimEnd();
    if (!cleaned) return;

    const line: LogLine = {
      id: ++logIdCounter,
      time: new Date().toISOString(),
      text: cleaned,
      type,
    };
    this.logs.push(line);
    if (this.logs.length > MAX_LOG_BUFFER) {
      this.logs = this.logs.slice(-MAX_LOG_BUFFER);
    }
    this.emit('log', line);
  }

  /** Subscribe to new log lines. Returns unsubscribe function. */
  subscribe(callback: (line: LogLine) => void): () => void {
    this.on('log', callback);
    return () => this.off('log', callback);
  }

  /** Subscribe to status changes. Returns unsubscribe function. */
  onStatusChange(callback: (status: BotStatus) => void): () => void {
    this.on('status', callback);
    return () => this.off('status', callback);
  }

  private setStatus(s: BotStatus) {
    this._status = s;
    this.emit('status', s);
  }

  async start(): Promise<void> {
    if (this.process) {
      this.addLog('⚠️  Bot đang chạy rồi', 'system');
      return;
    }

    if (await isBotApiAlive()) {
      this.setStatus('running');
      this.addLog(`⚠️  Phát hiện bot đã chạy sẵn trên port ${getBotPort()}, bỏ qua start trùng`, 'system');
      return;
    }

    this.setStatus('starting');
    this.addLog(`\n${'─'.repeat(60)}`, 'system');
    this.addLog(`▶  Khởi động bot...  [${new Date().toLocaleString('vi-VN')}]`, 'system');
    this.addLog(`   Dir: ${BOT_DIR}`, 'system');
    this.addLog(`${'─'.repeat(60)}`, 'system');

    const bunPath = getBunPath();

    try {
      this.process = spawn(bunPath, ['run', 'dev'], {
        cwd: BOT_DIR,
        env: {
          ...process.env,
          // Pass PATH with bun included
          PATH: `${path.dirname(bunPath)}${path.delimiter}${process.env.PATH || ''}`,
          FORCE_COLOR: '0', // disable color since we strip anyway
          // Override PORT explicitly - tránh thừa hưởng PORT=3000 từ Next.js web.
          PORT: getBotPort(),
        },
        windowsHide: true,
      });
    } catch (err) {
      this.setStatus('stopped');
      this.addLog(`❌  Không thể spawn process: ${(err as Error).message}`, 'system');
      return;
    }

    this.process.stdout?.setEncoding('utf-8');
    this.process.stderr?.setEncoding('utf-8');

    this.process.stdout?.on('data', (data: string) => {
      for (const line of data.split('\n')) {
        this.addLog(line, 'stdout');
      }
    });

    this.process.stderr?.on('data', (data: string) => {
      for (const line of data.split('\n')) {
        this.addLog(line, 'stderr');
      }
    });

    this.process.on('spawn', () => {
      this.startTime = Date.now();
      this.setStatus('running');
      this.addLog(`✅  Bot đã khởi động (PID ${this.process?.pid})`, 'system');
    });

    this.process.on('close', (code) => {
      this.process = null;
      this.startTime = null;
      this.setStatus('stopped');
      this.addLog(`${'─'.repeat(60)}`, 'system');
      this.addLog(`⏹  Bot đã dừng (exit code: ${code ?? 'null'})  [${new Date().toLocaleString('vi-VN')}]`, 'system');
      this.addLog(`${'─'.repeat(60)}\n`, 'system');
    });

    this.process.on('error', (err) => {
      this.process = null;
      this.startTime = null;
      this.setStatus('stopped');
      this.addLog(`❌  Lỗi process: ${err.message}`, 'system');
    });
  }

  async stop(): Promise<void> {
    if (!this.process) {
      if (await isBotApiAlive()) {
        this.setStatus('running');
        this.addLog('⚠️  Bot đang chạy nhưng không do BotManager quản lý, không thể dừng bằng fallback process', 'system');
        return;
      }
      this.setStatus('stopped');
      this.addLog('⚠️  Bot không đang chạy', 'system');
      return;
    }

    this.setStatus('stopping');
    this.addLog('⏸  Đang dừng bot...', 'system');

    const proc = this.process;

    // On Windows, use taskkill to kill process tree
    if (process.platform === 'win32' && proc.pid) {
      spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { windowsHide: true });
    } else {
      proc.kill('SIGTERM');
    }

    // Force kill after 6s
    const timeout = setTimeout(() => {
      if (proc.pid) {
        try {
          proc.kill('SIGKILL');
        } catch {}
      }
    }, 6000);

    await new Promise<void>((resolve) => {
      proc.once('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      // If already null (edge case)
      if (!this.process) resolve();
    });
  }

  async restart(): Promise<void> {
    this.addLog('🔄  Đang restart bot...', 'system');
    await this.stop();
    // Small delay
    await new Promise((r) => setTimeout(r, 1000));
    await this.start();
  }

  clearLogs(): void {
    this.logs = [];
    this.addLog('🗑  Đã xóa log', 'system');
  }

  getInfo() {
    const uptime =
      this._status === 'running' && this.startTime
        ? Math.floor((Date.now() - this.startTime) / 1000)
        : null;
    return {
      status: this._status,
      pid: this.process?.pid ?? null,
      logCount: this.logs.length,
      uptime,
    };
  }
}

// Singleton - persisted across Next.js HMR via global
declare global {
  // biome-ignore lint: global augmentation
  var __botManager: BotManager | undefined;
}

function createBotManager(): BotManager {
  return new BotManager();
}

export const botManager: BotManager =
  // biome-ignore lint: intentional global
  globalThis.__botManager ?? (globalThis.__botManager = createBotManager());
