import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

// Persist across Next.js hot reloads via globalThis
declare global {
  // biome-ignore lint: global augmentation
  var __botProcess: ChildProcess | null;
}

if (typeof globalThis.__botProcess === 'undefined') {
  globalThis.__botProcess = null;
}

const BOT_DIR = path.resolve(process.cwd(), '../bot');

export function getBotProcess(): ChildProcess | null {
  return globalThis.__botProcess;
}

export function isBotRunning(): boolean {
  const proc = globalThis.__botProcess;
  return proc !== null && proc.exitCode === null && !proc.killed;
}

export function getBotPid(): number | null {
  const proc = globalThis.__botProcess;
  return isBotRunning() ? (proc?.pid ?? null) : null;
}

export function startBot(): { success: boolean; message: string } {
  if (isBotRunning()) {
    return { success: false, message: 'Bot đang chạy rồi' };
  }

  try {
    const proc = spawn('bun', ['src/app/main.ts'], {
      cwd: BOT_DIR,
      detached: false,
      stdio: 'ignore',
      windowsHide: true,
    });

    proc.on('exit', (code) => {
      console.log(`[BotManager] Bot exited with code ${code}`);
      globalThis.__botProcess = null;
    });

    proc.on('error', (err) => {
      console.error('[BotManager] Bot process error:', err);
      globalThis.__botProcess = null;
    });

    globalThis.__botProcess = proc;
    return { success: true, message: `Bot đã khởi động (PID: ${proc.pid})` };
  } catch (err) {
    return { success: false, message: `Lỗi khởi động bot: ${err}` };
  }
}

export function stopBot(): { success: boolean; message: string } {
  const proc = globalThis.__botProcess;
  if (!proc || !isBotRunning()) {
    globalThis.__botProcess = null;
    return { success: false, message: 'Bot không chạy' };
  }

  try {
    proc.kill('SIGTERM');
    globalThis.__botProcess = null;
    return { success: true, message: 'Bot đã dừng' };
  } catch (err) {
    return { success: false, message: `Lỗi dừng bot: ${err}` };
  }
}
