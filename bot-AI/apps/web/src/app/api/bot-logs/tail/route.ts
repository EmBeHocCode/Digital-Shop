/**
 * SSE: Tail latest bot log file in real-time
 * GET /api/bot-logs/tail
 */
import { type NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const BOT_DIR = process.env.BOT_DIR || path.resolve(process.cwd(), '..', 'bot');
const LOGS_DIR = path.join(BOT_DIR, 'logs');

/** Find the most recently modified log folder */
function getLatestLogFile(): string | null {
  try {
    if (!fs.existsSync(LOGS_DIR)) return null;
    const entries = fs.readdirSync(LOGS_DIR, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        mtime: fs.statSync(path.join(LOGS_DIR, e.name)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!folders.length) return null;
    const latest = path.join(LOGS_DIR, folders[0].name, 'bot.txt');
    return fs.existsSync(latest) ? latest : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const since = Number(request.nextUrl.searchParams.get('since') ?? 0); // byte offset
  const encoder = new TextEncoder();

  let watcher: fs.FSWatcher | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch { closed = true; }
      };

      const logFile = getLatestLogFile();
      if (!logFile) {
        send({ error: 'No log file found' });
        controller.close();
        return;
      }

      // Read existing lines from offset
      let byteOffset = since;
      const readNewLines = () => {
        try {
          const stat = fs.statSync(logFile);
          if (stat.size <= byteOffset) return;

          const fd = fs.openSync(logFile, 'r');
          const bufSize = stat.size - byteOffset;
          const buf = Buffer.alloc(bufSize);
          fs.readSync(fd, buf, 0, bufSize, byteOffset);
          fs.closeSync(fd);
          byteOffset = stat.size;

          const text = buf.toString('utf-8');
          const lines = text.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              send({ type: 'log', data: parsed, offset: byteOffset });
            } catch {
              send({ type: 'raw', text: line, offset: byteOffset });
            }
          }
        } catch { /* file may be rotating */ }
      };

      // Send initial lines (last 200 lines)
      try {
        const content = fs.readFileSync(logFile, 'utf-8');
        const allLines = content.split('\n').filter((l) => l.trim());
        const tail = allLines.slice(-200);
        for (const line of tail) {
          try {
            send({ type: 'log', data: JSON.parse(line), offset: 0 });
          } catch {
            send({ type: 'raw', text: line, offset: 0 });
          }
        }
        byteOffset = Buffer.byteLength(content, 'utf-8');
      } catch { }

      // Send current log file name
      send({ type: 'meta', file: path.basename(path.dirname(logFile)) });

      // Watch for new data
      let debounce: NodeJS.Timeout | null = null;
      try {
        watcher = fs.watch(logFile, () => {
          if (closed) return;
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(readNewLines, 50);
        });
      } catch { }

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          // Re-check log file (new session may have started)
          const newFile = getLatestLogFile();
          if (newFile && newFile !== logFile) {
            send({ type: 'meta', file: path.basename(path.dirname(newFile)) });
            // Switch to new file
            try { watcher?.close(); } catch { }
            byteOffset = 0;
            readNewLines();
          }
        } catch { clearInterval(heartbeat); }
      }, 15_000);

      // Clean up on close
      (controller as ReadableStreamDefaultController & { __cleanup?: () => void }).__cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
        if (debounce) clearTimeout(debounce);
        try { watcher?.close(); } catch { }
      };
    },

    cancel() {
      closed = true;
      try { watcher?.close(); } catch { }
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
