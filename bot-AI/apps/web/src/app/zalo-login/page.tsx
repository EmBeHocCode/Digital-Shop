'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Play, RotateCcw, Trash2, ShieldCheck, Square, Eye, EyeOff } from 'lucide-react';

type BotStatus = 'running' | 'stopped' | 'starting' | 'stopping';

interface BotProcessInfo {
  status: BotStatus;
  pid: number | null;
  uptime: number | null;
}

interface AuthStatusInfo {
  botDir: string;
  credentialsExists: boolean;
  credentialsBase64Exists: boolean;
  qrExists: boolean;
  qrUpdatedAt: string | null;
  qrSize: number;
}

async function getBotProcess(): Promise<BotProcessInfo> {
  const res = await fetch('/api/bot-process', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json.data as BotProcessInfo;
}

async function postBotProcess(action: 'start' | 'stop' | 'restart') {
  const res = await fetch('/api/bot-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
}

async function getAuthStatus(): Promise<AuthStatusInfo> {
  const res = await fetch('/api/zalo-auth/status', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json.data as AuthStatusInfo;
}

async function clearAuthSession() {
  const res = await fetch('/api/zalo-auth/session', { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function ZaloLoginPage() {
  const [processInfo, setProcessInfo] = useState<BotProcessInfo | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrVersion, setQrVersion] = useState(() => Date.now());
  const [showQr, setShowQr] = useState(false);

  const loadAll = useCallback(async () => {
    const [p, a] = await Promise.all([getBotProcess(), getAuthStatus()]);
    setProcessInfo(p);
    setAuthStatus(a);
    setQrVersion(Date.now());
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await loadAll();
      } catch (error) {
        if (mounted) {
          toast.error('Không đọc được trạng thái đăng nhập', {
            description: (error as Error).message,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();

    const interval = window.setInterval(() => {
      void loadAll().catch(() => {});
    }, 3000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [loadAll]);

  const statusLabel = useMemo(() => {
    const s = processInfo?.status ?? 'stopped';
    if (s === 'running') return 'Đang chạy';
    if (s === 'starting') return 'Đang khởi động...';
    if (s === 'stopping') return 'Đang dừng...';
    return 'Đã dừng';
  }, [processInfo?.status]);

  const statusColor = useMemo(() => {
    const s = processInfo?.status ?? 'stopped';
    if (s === 'running') return 'bg-[#58CC02]/15 text-[#58CC02] border-[#58CC02]/40';
    if (s === 'starting' || s === 'stopping') return 'bg-[#FF9600]/15 text-[#FF9600] border-[#FF9600]/40';
    return 'bg-muted text-muted-foreground border-border';
  }, [processInfo?.status]);

  const runAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    try {
      await postBotProcess(action);
      toast.success(
        action === 'start' ? 'Đang khởi động bot...' : action === 'stop' ? 'Đang dừng bot...' : 'Đang khởi động lại bot...',
      );
      await loadAll();
    } catch (error) {
      toast.error('Thao tác bot thất bại', { description: (error as Error).message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearSession = async () => {
    setActionLoading('clear');
    try {
      const result = await clearAuthSession();
      toast.success(result?.message || 'Đã xóa phiên đăng nhập');
      await loadAll();
    } catch (error) {
      toast.error('Không xóa được phiên đăng nhập', { description: (error as Error).message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecreateQr = async () => {
    setActionLoading('recreate');
    try {
      await clearAuthSession();
      const running = processInfo?.status === 'running';
      await postBotProcess(running ? 'restart' : 'start');
      toast.success('Đang tạo mã QR mới...');
      await loadAll();
    } catch (error) {
      toast.error('Không tạo được mã QR mới', { description: (error as Error).message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-10 w-56 rounded-xl bg-muted animate-pulse" />
        <div className="h-[420px] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/40 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-[#1CB0F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Đăng nhập Zalo bằng QR</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý phiên đăng nhập bot trực tiếp trên web, không cần chạy tay ở terminal.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadAll()}
          disabled={actionLoading !== null}
          className="rounded-xl border-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái bot</p>
          <Badge className={`border ${statusColor}`}>{statusLabel}</Badge>
          <p className="text-sm text-muted-foreground">
            PID: <span className="font-mono">{processInfo?.pid ?? '-'}</span>
          </p>
          <p className="text-sm text-muted-foreground">Uptime: {formatUptime(processInfo?.uptime ?? null)}</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Phiên đăng nhập</p>
          <div className="flex items-center gap-2">
            {authStatus?.credentialsExists ? (
              <ShieldCheck className="h-4 w-4 text-[#58CC02]" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
            <p className="text-sm">{authStatus?.credentialsExists ? 'Đã có credentials.json' : 'Chưa có credentials.json'}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Nếu đã có phiên thì bot sẽ tự đăng nhập, thường không cần quét QR lại.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã QR</p>
          <p className="text-sm">{authStatus?.qrExists ? 'Đã có QR' : 'Chưa có QR'}</p>
          <p className="text-xs text-muted-foreground">
            Cập nhật: {authStatus?.qrUpdatedAt ? new Date(authStatus.qrUpdatedAt).toLocaleString('vi-VN') : '-'}
          </p>
          <p className="text-xs text-muted-foreground">Dung lượng: {authStatus?.qrSize ?? 0} bytes</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void runAction('start')}
            disabled={actionLoading !== null || processInfo?.status === 'running' || processInfo?.status === 'starting'}
            className="rounded-xl bg-[#58CC02] hover:bg-[#4CAF00] text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Khởi động bot
          </Button>
          <Button
            variant="outline"
            onClick={() => void runAction('restart')}
            disabled={actionLoading !== null || processInfo?.status === 'starting' || processInfo?.status === 'stopping'}
            className="rounded-xl border-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Khởi động lại bot
          </Button>
          <Button
            variant="outline"
            onClick={() => void runAction('stop')}
            disabled={actionLoading !== null || processInfo?.status === 'stopped' || processInfo?.status === 'stopping'}
            className="rounded-xl border-2"
          >
            <Square className="h-4 w-4 mr-2" />
            Dừng bot
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleClearSession()}
            disabled={actionLoading !== null}
            className="rounded-xl border-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa phiên đăng nhập
          </Button>
          <Button
            onClick={() => void handleRecreateQr()}
            disabled={actionLoading !== null}
            className="rounded-xl bg-[#1CB0F6] hover:bg-[#149BD7] text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tạo QR mới
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-4 flex flex-col items-center gap-3 min-h-[320px] justify-center">
          {authStatus?.qrExists ? (
            <>
              <div className="w-full max-w-[320px] flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQr((v) => !v)}
                  className="rounded-lg border-border/80"
                >
                  {showQr ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1.5" />
                      Ẩn QR
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1.5" />
                      Hiện QR
                    </>
                  )}
                </Button>
              </div>
              <div className="relative w-72 h-72 max-w-full">
                <img
                  src={`/api/zalo-auth/qr?t=${qrVersion}`}
                  alt="Mã QR đăng nhập Zalo"
                  className={`w-full h-full rounded-xl border border-border bg-white p-2 object-contain transition-all duration-200 ${
                    showQr ? '' : 'blur-xl brightness-90 saturate-75 select-none pointer-events-none'
                  }`}
                />
                {!showQr ? (
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-background/55 backdrop-blur-sm">
                    <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-medium text-foreground">
                      QR đang được che an toàn
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Mở Zalo trên điện thoại và quét mã QR này để đăng nhập bot.
              </p>
            </>
          ) : (
            <>
              <QrCode className="h-12 w-12 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground text-center max-w-xl">
                Chưa có mã QR. Hãy bấm <span className="font-semibold">Khởi động bot</span> hoặc{' '}
                <span className="font-semibold">Tạo QR mới</span> để tạo mã quét.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
