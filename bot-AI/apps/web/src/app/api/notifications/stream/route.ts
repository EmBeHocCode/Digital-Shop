/**
 * GET /api/notifications/stream
 * SSE: watches bot log file, emits structured notifications for:
 *  - error level logs (level >= 50)
 *  - backup failure / success
 *  - bot restart (new session detected)
 */
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const BOT_DIR  = process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');
const LOGS_DIR = path.join(BOT_DIR, 'logs');
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:10000/api';
const BOT_API_KEY = process.env.BOT_API_KEY || '';

function getLatestLogFile(): string | null {
  try {
    if (!fs.existsSync(LOGS_DIR)) return null;
    const folders = fs.readdirSync(LOGS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, mtime: fs.statSync(path.join(LOGS_DIR, e.name)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime);
    if (!folders.length) return null;
    const p = path.join(LOGS_DIR, folders[0].name, 'bot.txt');
    return fs.existsSync(p) ? p : null;
  } catch { return null; }
}

type NotifType = 'error' | 'backup_fail' | 'backup_ok' | 'restart' | 'warn';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  msg: string;
  time: string; // ISO
}

function classify(raw: string): Notif | null {
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(raw); } catch { return null; }

  const level   = Number(parsed.level ?? 0);
  const msg     = String(parsed.msg ?? parsed.message ?? '');
  const cat     = String(parsed.category ?? '');
  const time    = parsed.time ? String(parsed.time) : new Date().toISOString();
  const id      = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Bot restart detected via new session marker
  if (msg.startsWith('>>> main:listening') || msg === 'main:listening') {
    return { id, type: 'restart', title: 'Bot đã khởi động lại', msg: 'Bot vừa restart và đang lắng nghe', time };
  }

  // Backup
  if (cat === 'AUTO_BACKUP' || cat === 'CLOUD_BACKUP') {
    if (/backup.*success|upload.*success|uploaded/i.test(msg)) {
      return { id, type: 'backup_ok', title: 'Backup thành công', msg, time };
    }
    if (/fail|error|401|403/i.test(msg)) {
      return { id, type: 'backup_fail', title: 'Backup thất bại', msg: msg.slice(0, 120), time };
    }
  }

  // Error logs
  if (level >= 50) {
    return { id, type: 'error', title: `Lỗi${cat ? ` [${cat}]` : ''}`, msg: msg.slice(0, 160), time };
  }

  // Warning (only notable ones)
  if (level >= 40 && (cat === 'CHAT' || cat === 'AI' || cat === 'GATEWAY')) {
    return { id, type: 'warn', title: `Cảnh báo [${cat}]`, msg: msg.slice(0, 120), time };
  }

  return null;
}

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: object) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); }
        catch { closed = true; }
      };

      let currentFile: string | null = null;
      let byteOffset = 0;
      let watcher: fs.FSWatcher | null = null;

      const readNew = () => {
        const file = currentFile;
        if (!file || !fs.existsSync(file)) return;
        try {
          const stat = fs.statSync(file);
          if (stat.size <= byteOffset) return;
          const fd  = fs.openSync(file, 'r');
          const buf = Buffer.alloc(stat.size - byteOffset);
          fs.readSync(fd, buf, 0, buf.length, byteOffset);
          fs.closeSync(fd);
          byteOffset = stat.size;
          const lines = buf.toString('utf-8').split('\n').filter(l => l.trim());
          for (const line of lines) {
            const n = classify(line);
            if (n) send({ type: 'notif', data: n });
          }
        } catch { /* rotating */ }
      };

      const watchFile = (file: string) => {
        watcher?.close();
        watcher = null;
        byteOffset = fs.existsSync(file) ? fs.statSync(file).size : 0; // skip history
        try {
          watcher = fs.watch(file, () => { if (!closed) readNew(); });
        } catch { /* ignore */ }
      };

      // Initial file
      currentFile = getLatestLogFile();
      if (currentFile) {
        watchFile(currentFile);
      }

      // Poll every 10s for new sessions (restart creates new log folder)
      const sessionPoller = setInterval(() => {
        if (closed) { clearInterval(sessionPoller); return; }
        const latest = getLatestLogFile();
        if (latest && latest !== currentFile) {
          currentFile = latest;
          watchFile(latest);
          // Emit restart notification
          const n: Notif = {
            id: `${Date.now()}-restart`,
            type: 'restart',
            title: 'Bot đã khởi động lại',
            msg: `Session mới: ${path.basename(path.dirname(latest))}`,
            time: new Date().toISOString(),
          };
          send({ type: 'notif', data: n });
        }
      }, 10_000);

      // Heartbeat
      const hb = setInterval(() => {
        if (closed) { clearInterval(hb); return; }
        send({ type: 'ping' });
      }, 20_000);

      // ─── API Key Health Polling ───────────────────────────────────────────────────────────
      const keyPrevStatus = new Map<string, string>();
      let apiHealthTimer: ReturnType<typeof setTimeout> | null = null;

      const pollApiHealth = async () => {
        if (closed) return;
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (BOT_API_KEY) headers.Authorization = `Bearer ${BOT_API_KEY}`;
          const res = await fetch(`${BOT_API_URL}/env/validate`, {
            headers,
            signal: AbortSignal.timeout(10_000),
          });
          if (!res.ok) return;
          const body = await res.json() as {
            success: boolean;
            data?: { results: Array<{ key: string; status: string; message?: string }> };
          };
          if (!body.success || !body.data?.results) return;

          for (const item of body.data.results) {
            const prev = keyPrevStatus.get(item.key);
            keyPrevStatus.set(item.key, item.status);

            // Vừa hỏng: valid/chưa biết → invalid/error
            if ((prev === 'valid' || prev === undefined) && (item.status === 'invalid' || item.status === 'error')) {
              send({ type: 'notif', data: {
                id: `${Date.now()}-apikey-${item.key}`,
                type: 'warn' as NotifType,
                title: item.status === 'invalid' ? `API Key không hợp lệ: ${item.key}` : `Lỗi xác thực: ${item.key}`,
                msg: item.message ?? 'API Key này đang có vấn đề, một số lệnh có thể không hoạt động',
                time: new Date().toISOString(),
              } as Notif });
            }
            // Phục hồi: hỏng → valid
            if ((prev === 'invalid' || prev === 'error') && item.status === 'valid') {
              send({ type: 'notif', data: {
                id: `${Date.now()}-apikey-${item.key}-ok`,
                type: 'backup_ok' as NotifType,
                title: `API Key phục hồi: ${item.key}`,
                msg: 'Key đã được xác thực thành công',
                time: new Date().toISOString(),
              } as Notif });
            }
          }
        } catch { /* bot offline hoặc không thể kết nối */ }

        if (!closed) {
          apiHealthTimer = setTimeout(pollApiHealth, 5 * 60 * 1000);
        }
      };

      // Poll lần đầu sau 45 giây (chờ bot khởi động xong)
      apiHealthTimer = setTimeout(pollApiHealth, 45_000);

      // Cleanup
      return () => {
        closed = true;
        watcher?.close();
        clearInterval(sessionPoller);
        clearInterval(hb);
        if (apiHealthTimer !== null) clearTimeout(apiHealthTimer);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
