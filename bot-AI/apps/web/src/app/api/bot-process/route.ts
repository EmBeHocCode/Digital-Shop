/**
 * Bot Process API - Start / Stop / Restart / Status
 * Ưu tiên dùng NSSM service nếu có, fallback sang BotManager process
 */
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { botManager } from '@/lib/bot-manager';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const NSSM = path.resolve(process.cwd(), '..', '..', 'tools', 'nssm.exe');
const SERVICE = 'MeowBot';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:10000/api';
const BOT_API_KEY = process.env.BOT_API_KEY || '';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (BOT_API_KEY) headers.Authorization = `Bearer ${BOT_API_KEY}`;
  return headers;
}

async function nssmRunning(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(NSSM, ['status', SERVICE]);
    return stdout.trim().startsWith('SERVICE_RUNNING');
  } catch { return false; }
}

async function nssmExists(): Promise<boolean> {
  try {
    const fs = await import('node:fs');
    return fs.existsSync(NSSM);
  } catch { return false; }
}

/** Ping bot HTTP API để xác định status thực tế (hoạt động dù bot được khởi động từ ngoài) */
async function pingBotApi(): Promise<boolean> {
  // Thử /health trước (nhanh hơn, không cần auth)
  const endpoints = [
    { url: `${BOT_API_URL}/health`, headers: {} as Record<string, string> },
    { url: `${BOT_API_URL}/settings`, headers: getAuthHeaders() },
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: ep.headers,
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok || res.status === 401 || res.status === 403) return true; // server responded = alive
    } catch {  }
  }
  return false;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getServiceStatus(): Promise<{ status: string; pid: number | null; uptime: number | null }> {
  if (!(await nssmExists())) {
    // Nếu botManager đang quản lý process thì dùng info của nó (có PID + uptime)
    const info = botManager.getInfo();
    if (info.status === 'running' || info.status === 'starting' || info.status === 'stopping') {
      return info;
    }
    // Ngược lại ping bot API để phát hiện bot chạy ngoài (bun run dev trong terminal)
    const alive = await pingBotApi();
    return { status: alive ? 'running' : 'stopped', pid: info.pid, uptime: info.uptime };
  }
  const running = await nssmRunning();
  if (!running) {
    const info = botManager.getInfo();
    if (info.status === 'running' || info.status === 'starting' || info.status === 'stopping') {
      return info;
    }
    return { status: 'stopped', pid: info.pid, uptime: info.uptime };
  }

  // NSSM service có thể RUNNING nhưng process bot crash liên tục (service restart loop).
  // Xác nhận thêm bằng health API để phản ánh đúng trạng thái thực tế.
  const alive = await pingBotApi();
  return {
    status: alive ? 'running' : 'stopped',
    pid: null,
    uptime: null,
  };
}

/** GET /api/bot-process → current status + info */
export async function GET() {
  const data = await getServiceStatus();
  return NextResponse.json({ success: true, data });
}

/** POST /api/bot-process  body: { action: 'start' | 'stop' | 'restart' | 'clear-logs' } */
export async function POST(request: NextRequest) {
  let action: string;
  try {
    const body = await request.json();
    action = body?.action ?? '';
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (action === 'clear-logs') {
    botManager.clearLogs();
    return NextResponse.json({ success: true, data: { action: 'clear-logs' } });
  }

  if (action !== 'start' && action !== 'stop' && action !== 'restart') {
    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Chặn start chồng: nếu bot API đã sống thì coi như đang chạy, không spawn thêm.
  if (action === 'start' && (await pingBotApi())) {
    return NextResponse.json({
      success: true,
      data: { action, status: 'running', via: 'already-running' },
    });
  }

  // Dùng NSSM nếu có
  if (await nssmExists()) {
    const nssmAction: 'start' | 'stop' | 'restart' = action;

    try {
      await execFileAsync(NSSM, [nssmAction, SERVICE]);

      if (action === 'stop') {
        // Dọn cả fallback process nếu có.
        await botManager.stop().catch(() => {});
        return NextResponse.json({ success: true, data: { action, via: 'nssm' } });
      }

      // Chờ NSSM start/restart xong, xác nhận API hoạt động thật trước khi trả success.
      await wait(2500);
      if (await pingBotApi()) {
        return NextResponse.json({ success: true, data: { action, via: 'nssm' } });
      }

      // Service tồn tại nhưng bot API chưa lên (thường do service config lỗi/port conflict),
      // fallback sang BotManager để dashboard vẫn khởi động được bot.
      if (action === 'start') {
        await botManager.start();
      } else {
        await botManager.restart();
      }

      return NextResponse.json({
        success: true,
        data: { action, via: 'bot-manager-fallback', reason: 'nssm_not_serving_api' },
      });
    } catch (err) {
      if (action === 'stop') {
        await botManager.stop().catch(() => {});
        return NextResponse.json({ success: true, data: { action, via: 'bot-manager-fallback' } });
      }

      // Nếu NSSM action lỗi, fallback sang BotManager.
      try {
        if (action === 'start') {
          await botManager.start();
        } else {
          await botManager.restart();
        }
        return NextResponse.json({
          success: true,
          data: { action, via: 'bot-manager-fallback', reason: 'nssm_error', nssmError: String(err) },
        });
      } catch (fallbackErr) {
        return NextResponse.json(
          { success: false, error: String(err), fallbackError: String(fallbackErr) },
          { status: 500 },
        );
      }
    }
  }

  // Fallback: BotManager process
  switch (action) {
    case 'start':
      botManager.start().catch(console.error);
      return NextResponse.json({ success: true, data: { action: 'start', status: botManager.status } });
    case 'stop':
      botManager.stop().catch(console.error);
      return NextResponse.json({ success: true, data: { action: 'stop', status: botManager.status } });
    case 'restart':
      botManager.restart().catch(console.error);
      return NextResponse.json({ success: true, data: { action: 'restart', status: botManager.status } });
  }
}
