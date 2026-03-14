/**
 * Bot Log Stream - SSE (Server-Sent Events)
 * GET /api/bot-process/logs?since=<id>
 * Streams log lines in real-time via SSE
 */
import { type NextRequest } from 'next/server';
import { botManager, type LogLine } from '@/lib/bot-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sinceId = Number(request.nextUrl.searchParams.get('since') ?? 0);

  const encoder = new TextEncoder();

  function encode(line: LogLine): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(line)}\n\n`);
  }

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send existing buffered logs (only those after sinceId)
      const existing = botManager.getLogs().filter((l) => l.id > sinceId);
      for (const line of existing) {
        controller.enqueue(encode(line));
      }

      // Heartbeat every 20s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      // Subscribe to incoming logs
      unsubscribe = botManager.subscribe((line: LogLine) => {
        try {
          controller.enqueue(encode(line));
        } catch {
          // Stream already closed
        }
      });

      // Also send status events
      const unsubStatus = botManager.onStatusChange((status) => {
        try {
          controller.enqueue(
            encoder.encode(`event: status\ndata: ${JSON.stringify({ status })}\n\n`),
          );
        } catch {}
      });

      // Store cleanup refs
      (controller as ReadableStreamDefaultController & { __cleanup?: () => void }).__cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe?.();
        unsubStatus();
      };
    },
    cancel(controller) {
      (controller as ReadableStreamDefaultController & { __cleanup?: () => void }).__cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
