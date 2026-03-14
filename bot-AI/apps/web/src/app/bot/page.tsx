'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  ChevronDown,
  Loader2,
  Terminal as TerminalIcon,
  FileText,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/use-notification-sound';

type BotProcessStatus = 'running' | 'stopped' | 'starting' | 'stopping';
type ActiveTab = 'bot' | 'web';

interface RawLogData {
  level?: number;
  time?: string;
  msg?: string;
  message?: string;
  category?: string;
  step?: string;
  [key: string]: unknown;
}

interface DisplayLine {
  id: number;
  time: string;
  level: 'info' | 'debug' | 'warn' | 'error' | 'system';
  category: string;
  msg: string;
}

let idSeq = Math.floor(Math.random() * 1e12);
const nextId = () => ++idSeq;

function levelFromNumber(n?: number): DisplayLine['level'] {
  if (!n) return 'info';
  if (n >= 50) return 'error';
  if (n >= 40) return 'warn';
  if (n <= 10) return 'debug'; // trace only
  return 'info';
}

function parseBotLogEntry(raw: string): DisplayLine | null {
  if (!raw.trim()) return null;
  try {
    const d: RawLogData = JSON.parse(raw);
    const msg = String(d.msg ?? d.message ?? '');
    const category = String(d.category ?? d.step ?? '');
    const level = levelFromNumber(d.level);
    const time = d.time
      ? new Date(d.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    return { id: nextId(), time, level, category, msg };
  } catch {
    return { id: nextId(), time: '', level: 'info', category: '', msg: raw };
  }
}

function parseWebLogLine(text: string): DisplayLine {
  // Detect level from Next.js output patterns
  let level: DisplayLine['level'] = 'info';
  if (/error|Error|ERR/i.test(text)) level = 'error';
  else if (/warn|Warning/i.test(text)) level = 'warn';
  else if (/\u2713|Ready|compiled|success/i.test(text)) level = 'info';
  else if (/^\s*$/.test(text)) level = 'debug';

  // Extract time if present
  const timeMatch = text.match(/(\d{2}:\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '';

  return { id: nextId(), time, level, category: '', msg: text };
}

const LEVEL_COLOR: Record<DisplayLine['level'], string> = {
  debug:  'text-muted-foreground/30',
  info:   'text-foreground/65',
  warn:   'text-[#FF9600]/90',
  error:  'text-[#FF4B4B]',
  system: 'text-[#1CB0F6]/80',
};

const CATEGORY_COLOR: Record<string, string> = {
  BUFFER:     'text-[#CE82FF]/70',
  CHAT:       'text-[#1CB0F6]/70',
  GATEWAY:    'text-[#FF9600]/70',
  AI:         'text-[#58CC02]/70',
  ZALO:       'text-[#1CB0F6]/70',
  DATABASE:   'text-[#FF9600]/60',
  INIT:       'text-[#58CC02]/70',
  MODULE_MGR: 'text-muted-foreground/50',
};

async function callProcessApi(action: string) {
  const res = await fetch('/api/bot-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchProcessStatus() {
  const res = await fetch('/api/bot-process');
  const json = await res.json();
  return json.data as { status: BotProcessStatus; pid: number | null; uptime: number | null };
}

const MAX_LINES = 500;

function useSSELines(
  endpoint: string,
  parse: (raw: string) => DisplayLine | null,
  onMeta?: (file: string) => void,
) {
  const [lines, setLines] = useState<DisplayLine[]>([]);
  const pendingRef = useRef<DisplayLine[]>([]);
  const rafRef = useRef<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onMetaRef = useRef(onMeta);
  useEffect(() => { onMetaRef.current = onMeta; }, [onMeta]);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const toAdd = pendingRef.current.splice(0);
      if (toAdd.length === 0) return;
      setLines((prev) => {
        const combined = prev.length + toAdd.length > MAX_LINES
          ? [...prev, ...toAdd].slice(-MAX_LINES)
          : [...prev, ...toAdd];
        return combined;
      });
    });
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    sseRef.current?.close();
    const es = new EventSource(endpoint);
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.error || !payload.type) return;
        if (payload.type === 'meta') { onMetaRef.current?.(payload.file); return; }
        // bot log: { type: 'log', data: {...} } | { type: 'raw', text: '...' }
        // web log: { type: 'line', text: '...' } | { type: 'system', text: '...' }
        let rawText: string;
        if (payload.type === 'log') rawText = JSON.stringify(payload.data);
        else rawText = payload.text ?? '';
        if (!rawText) return;
        if (payload.type === 'system') {
          pendingRef.current.push({ id: nextId(), time: '', level: 'system', category: '', msg: rawText });
        } else {
          const line = parse(rawText);
          if (line) pendingRef.current.push(line);
        }
        scheduleFlush();
      } catch {}
    };
    es.onerror = () => {
      if (reconnectTimeoutRef.current !== null) window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => connectRef.current?.(), 4000);
    };
  }, [endpoint, parse, scheduleFlush]);

  useEffect(() => { connectRef.current = connect; }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current !== null) window.clearTimeout(reconnectTimeoutRef.current);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      sseRef.current?.close();
    };
  }, [connect]);

  return { lines, setLines };
}

export default function BotTerminalPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('bot');
  const [status, setStatus] = useState<BotProcessStatus>('stopped');
  const [pid, setPid] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [sessionFolder, setSessionFolder] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { play: playClick } = useNotificationSound({ src: '/sounds/click.mp3', volume: 0.5 });
  const { play: playBotStart } = useNotificationSound({ src: '/sounds/bot-start.mp3', volume: 0.7 });

  const botScrollRef = useRef<HTMLDivElement>(null);
  const webScrollRef = useRef<HTMLDivElement>(null);

  const parseBotMemo = useCallback((raw: string) => parseBotLogEntry(raw), []);
  const parseWebMemo = useCallback((raw: string) => parseWebLogLine(raw), []);
  const handleMeta = useCallback((file: string) => setSessionFolder(file), []);

  // Single SSE connection per endpoint (meta handled inside useSSELines)
  const { lines: botLines, setLines: setBotLines } = useSSELines('/api/bot-logs/tail', parseBotMemo, handleMeta);
  const { lines: webLines } = useSSELines('/api/web-logs/tail', parseWebMemo);

  // Poll bot process status
  const pollNowRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const info = await fetchProcessStatus();
        if (!mounted) return;
        setStatus(info.status);
        setPid(info.pid);
        setUptime(info.uptime);
      } catch {}
    };
    pollNowRef.current = poll;
    poll();
    const interval = setInterval(poll, 3000);
    return () => { mounted = false; clearInterval(interval); pollNowRef.current = null; };
  }, []);

  // Auto scroll
  const scrollRef = activeTab === 'bot' ? botScrollRef : webScrollRef;
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [botLines, webLines, autoScroll, activeTab, scrollRef]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };

  const handleAction = async (action: string) => {
    playClick();
    // Phát âm thanh khởi động khi start / restart
    if (action === 'start' || action === 'restart') playBotStart();
    setActionLoading(action);
    // Optimistic status update so button flips immediately
    if (action === 'start') setStatus('starting');
    else if (action === 'stop') setStatus('stopping');
    else if (action === 'restart') setStatus('starting');
    try {
      await callProcessApi(action);
      if (action === 'clear-logs') {
        setBotLines([]);
        toast.success('Đã xóa log');
      } else {
        toast.success(
          action === 'start' ? 'Đang khởi động bot...'
          : action === 'stop' ? 'Đang dừng bot...'
          : 'Đang restart bot...',
        );
        // Re-poll a few times after action to sync real status
        setTimeout(() => pollNowRef.current?.(), 1500);
        setTimeout(() => pollNowRef.current?.(), 4000);
        setTimeout(() => pollNowRef.current?.(), 8000);
      }
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message}`);
      // Revert optimistic on error
      pollNowRef.current?.();
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (s: number | null) => {
    if (s === null) return null;
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  const isRunning = status === 'running';
  const isStopped = status === 'stopped';
  const isTransitioning = status === 'starting' || status === 'stopping';
  const statusDot = {
    running:  'bg-[#58CC02] animate-pulse',
    stopped:  'bg-muted-foreground/40',
    starting: 'bg-[#FF9600] animate-pulse',
    stopping: 'bg-[#FF9600] animate-pulse',
  }[status];
  const statusLabel = {
    running:  'Đang chạy',
    stopped:  'Đã dừng',
    starting: 'Đang khởi động...',
    stopping: 'Đang dừng...',
  }[status];

  const visibleBotLines = useMemo(
    () => showDebug ? botLines : botLines.filter((l) => l.level !== 'debug'),
    [botLines, showDebug],
  );
  const visibleWebLines = webLines;

  const currentLines = activeTab === 'bot' ? visibleBotLines : visibleWebLines;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ff006e]/10 border border-[#ff006e]/30 flex items-center justify-center">
            <TerminalIcon className="h-4 w-4 text-[#ff006e]" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Bot Terminal</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span className={cn('w-1.5 h-1.5 rounded-full', statusDot)} />
              <span className={cn('font-medium', {
                'text-[#58CC02]': isRunning,
                'text-[#FF9600]': isTransitioning,
                'text-muted-foreground': isStopped,
              })}>{statusLabel}</span>
              {pid && <span className="text-muted-foreground/40">· PID {pid}</span>}
              {uptime !== null && <span className="text-muted-foreground/40">· {formatUptime(uptime)}</span>}
              {sessionFolder && activeTab === 'bot' && (
                <span className="flex items-center gap-1 text-muted-foreground/40">
                  · <FileText className="h-2.5 w-2.5" /> {sessionFolder}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'bot' && (
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className={cn('h-8 px-3 rounded-lg border text-xs font-medium transition-all',
                showDebug
                  ? 'border-[#CE82FF]/60 text-[#CE82FF] bg-[#CE82FF]/10'
                  : 'border-muted/40 text-muted-foreground hover:border-muted',
              )}
            >DEBUG</button>
          )}
          {activeTab === 'bot' && (
            <Button size="sm" variant="outline" onClick={() => handleAction('clear-logs')} disabled={!!actionLoading}
              className="h-8 px-3 text-xs border-muted hover:border-[#FF4B4B]/50 hover:text-[#FF4B4B]">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Xóa
            </Button>
          )}
          {activeTab === 'bot' && (
            <Button size="sm" variant="outline" onClick={() => handleAction('restart')}
              disabled={!!actionLoading || isTransitioning}
              className="h-8 px-3 text-xs border-[#FF9600]/40 text-[#FF9600] hover:bg-[#FF9600]/10">
              {actionLoading === 'restart' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5 mr-1.5" />}Restart
            </Button>
          )}
          {activeTab === 'bot' && (
            isStopped
              ? <Button size="sm" onClick={() => handleAction('start')} disabled={!!actionLoading}
                  className="h-8 px-4 text-xs bg-[#58CC02] hover:bg-[#46A302] text-white border-0">
                  {actionLoading === 'start' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />}Khởi động
                </Button>
              : <Button size="sm" variant="outline" onClick={() => handleAction('stop')}
                  disabled={!!actionLoading || isTransitioning}
                  className="h-8 px-4 text-xs border-[#FF4B4B]/40 text-[#FF4B4B] hover:bg-[#FF4B4B]/10">
                  {actionLoading === 'stop' ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />}Dừng
                </Button>
          )}
        </div>
      </div>

      {/* Terminal Box */}
      <div className="flex-1 rounded-xl border border-border bg-[#0a0a0a] overflow-hidden flex flex-col min-h-0 relative">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border/40 bg-card/30 shrink-0">
          <div className="flex gap-1.5 px-3 py-2 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF9600]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#58CC02]/60" />
          </div>

          {/* Tabs */}
          <button
            type="button"
            onClick={() => { setActiveTab('bot'); setAutoScroll(true); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
              activeTab === 'bot'
                ? 'border-[#ff006e] text-[#ff006e]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <TerminalIcon className="h-3 w-3" />
            Bot
            <span className={cn('text-[10px] px-1 py-0.5 rounded font-mono',
              isRunning ? 'text-[#58CC02] bg-[#58CC02]/15' : 'text-muted-foreground/50 bg-muted/30',
            )}>
              {visibleBotLines.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('web'); setAutoScroll(true); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
              activeTab === 'web'
                ? 'border-[#1CB0F6] text-[#1CB0F6]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Globe className="h-3 w-3" />
            Web
            <span className="text-[10px] px-1 py-0.5 rounded font-mono text-muted-foreground/50 bg-muted/30">
              {visibleWebLines.length}
            </span>
          </button>

          <span className="ml-auto mr-3 text-xs text-muted-foreground/30 font-mono">
            live · {currentLines.length} dòng
          </span>
        </div>

        {/* Log content */}
        <div
          ref={activeTab === 'bot' ? botScrollRef : webScrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-[1.6] overscroll-none"
        >
          {/* Bot tab */}
          {activeTab === 'bot' && (
            visibleBotLines.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground/25 text-sm font-sans">
                {isRunning ? 'Chờ log...' : 'Bot chưa chạy — bấm "Khởi động" để bắt đầu'}
              </div>
            ) : visibleBotLines.map((line) => (
              <div key={line.id} style={{ contain: 'layout' }} className={cn('flex gap-2 px-1 rounded hover:bg-white/[0.025]', LEVEL_COLOR[line.level])}>
                <span className="shrink-0 text-muted-foreground/20 select-none w-[60px] text-right">{line.time}</span>
                {line.category
                  ? <span className={cn('shrink-0 w-[96px] truncate', CATEGORY_COLOR[line.category] || 'text-muted-foreground/40')}>[{line.category}]</span>
                  : <span className="shrink-0 w-[96px]" />}
                <span className="break-all whitespace-pre-wrap min-w-0">{line.msg}</span>
              </div>
            ))
          )}

          {/* Web tab */}
          {activeTab === 'web' && (
            visibleWebLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/25 text-sm font-sans">
                <Globe className="h-8 w-8 opacity-20" />
                <span>Chưa có log web</span>
                <span className="text-xs text-center max-w-xs">Chạy service-install.cmd để cài services, sau đó log sẽ xuất hiện ở đây</span>
              </div>
            ) : visibleWebLines.map((line) => (
              <div key={line.id} style={{ contain: 'layout' }} className={cn('flex gap-2 px-1 rounded hover:bg-white/[0.025]', LEVEL_COLOR[line.level])}>
                <span className="shrink-0 text-muted-foreground/20 select-none w-[60px] text-right">{line.time}</span>
                <span className="break-all whitespace-pre-wrap min-w-0 flex-1">{line.msg}</span>
              </div>
            ))
          )}
        </div>

        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              const el = scrollRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-muted-foreground hover:text-foreground hover:border-[#ff006e]/50 transition-all shadow-lg"
          >
            <ChevronDown className="h-3.5 w-3.5" />Cuộn xuống
          </button>
        )}
      </div>
    </div>
  );
}
