/**
 * SSE: Tail web server log file in real-time
 * GET /api/web-logs/tail
 * Reads from service-logs/web/stdout.log (written by NSSM service)
 */
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

// Root của project (2 cấp trên apps/web)
const PROJECT_ROOT = path.resolve(process.cwd(), '..', '..');
const WEB_LOG_FILE = path.join(PROJECT_ROOT, 'service-logs', 'web', 'stdout.log');

// Strip ANSI escape codes (color codes from terminal output)
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b\][^\x07]*(\x07|\x1b\\)/g, '').replace(/\x1b[()][A-B0-9]/g, '');
}

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch { closed = true; }
      };

      // Send log file path info
      send({ type: 'meta', file: WEB_LOG_FILE });

      // If file doesn't exist yet, notify and wait
      if (!fs.existsSync(WEB_LOG_FILE)) {
        send({ type: 'system', text: `Web log chưa có. Đang chờ file: ${WEB_LOG_FILE}` });
        send({ type: 'system', text: 'Chạy service-install.cmd để cài services, sau đó log sẽ xuất hiện ở đây.' });
      }

      let byteOffset = 0;

      const readNewLines = () => {
        try {
          if (!fs.existsSync(WEB_LOG_FILE)) return;
          const stat = fs.statSync(WEB_LOG_FILE);
          if (stat.size <= byteOffset) return;

          const fd = fs.openSync(WEB_LOG_FILE, 'r');
          const bufSize = stat.size - byteOffset;
          const buf = Buffer.alloc(bufSize);
          fs.readSync(fd, buf, 0, bufSize, byteOffset);
          fs.closeSync(fd);
          byteOffset = stat.size;

          const text = buf.toString('utf-8');
          const lines = text.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            const cleaned = stripAnsi(line);
            if (cleaned.trim()) send({ type: 'line', text: cleaned });
          }
        } catch { /* file rotating */ }
      };

      // Send last 300 lines on connect
      if (fs.existsSync(WEB_LOG_FILE)) {
        try {
          const content = fs.readFileSync(WEB_LOG_FILE, 'utf-8');
          const allLines = content.split('\n').filter((l) => l.trim());
          const tail = allLines.slice(-300);
          for (const line of tail) {
            const cleaned = stripAnsi(line);
            if (cleaned.trim()) send({ type: 'line', text: cleaned });
          }
          byteOffset = Buffer.byteLength(content, 'utf-8');
        } catch { }
      }

      // Watch for changes
      let watcher: fs.FSWatcher | null = null;
      let debounce: NodeJS.Timeout | null = null;

      const startWatch = () => {
        try {
          if (!fs.existsSync(WEB_LOG_FILE)) return;
          watcher = fs.watch(WEB_LOG_FILE, () => {
            if (closed) return;
            if (debounce) clearTimeout(debounce);
            debounce = setTimeout(readNewLines, 50);
          });
        } catch { }
      };
      startWatch();

      // Heartbeat + re-check if file appears
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          if (!watcher && fs.existsSync(WEB_LOG_FILE)) {
            readNewLines();
            startWatch();
          }
        } catch { clearInterval(heartbeat); }
      }, 15_000);

      (controller as ReadableStreamDefaultController & { __cleanup?: () => void }).__cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
        if (debounce) clearTimeout(debounce);
        try { watcher?.close(); } catch { }
      };
    },

    cancel() {
      closed = true;
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
