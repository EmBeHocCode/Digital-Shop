'use client';

import { useState, useSyncExternalStore } from 'react';
import { Bell, AlertCircle, CheckCircle, RefreshCw, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification, type NotifType } from '@/hooks/use-notifications';

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  error:       { icon: <AlertCircle className="h-4 w-4" />,    color: 'text-[#FF4B4B]',  bg: 'bg-[#FF4B4B]/10' },
  backup_fail: { icon: <AlertTriangle className="h-4 w-4" />,  color: 'text-[#FF9600]',  bg: 'bg-[#FF9600]/10' },
  backup_ok:   { icon: <CheckCircle className="h-4 w-4" />,    color: 'text-[#58CC02]',  bg: 'bg-[#58CC02]/10' },
  restart:     { icon: <RefreshCw className="h-4 w-4" />,      color: 'text-[#1CB0F6]',  bg: 'bg-[#1CB0F6]/10' },
  warn:        { icon: <AlertTriangle className="h-4 w-4" />,  color: 'text-[#FF9600]',  bg: 'bg-[#FF9600]/10' },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function NotifItem({ n }: { n: Notification }) {
  const cfg = TYPE_CONFIG[n.type];
  return (
    <div className={cn(
      'flex gap-3 px-3 py-2.5 rounded-lg transition-colors',
      !n.read ? 'bg-white/[0.04]' : 'opacity-60',
    )}>
      <div className={cn('mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg, cfg.color)}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold truncate">{n.title}</span>
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{timeAgo(n.time)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground/70 break-words line-clamp-2">{n.msg}</p>
      </div>
      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#ff006e] mt-1.5 shrink-0" />}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifs, unread, markAllRead, clear } = useNotifications();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const visibleNotifs = isHydrated ? notifs : [];
  const visibleUnread = isHydrated ? unread : 0;

  const handleOpen = () => {
    if (!isHydrated) {
      setOpen(v => !v);
      return;
    }

    setOpen(v => !v);
    if (!open && visibleUnread > 0) {
      // mark read after 1s delay
      setTimeout(markAllRead, 1000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-muted transition-colors"
        title="Thông báo"
      >
        <Bell className={cn('h-5 w-5 transition-colors', visibleUnread > 0 ? 'text-foreground' : 'text-muted-foreground')} />
        {visibleUnread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-[#FF4B4B] text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {visibleUnread > 9 ? '9+' : visibleUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-sm font-bold">Thông báo</span>
                {visibleUnread > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF4B4B]/15 text-[#FF4B4B] font-semibold">
                    {visibleUnread} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {visibleNotifs.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={markAllRead}
                      title="Đánh dấu tất cả đã đọc"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      title="Xóa tất cả"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/50 hover:text-[#FF4B4B] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-0.5">
              {visibleNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/30">
                  <Bell className="h-8 w-8 opacity-30" />
                  <span className="text-xs">Chưa có thông báo</span>
                </div>
              ) : (
                visibleNotifs.map(n => <NotifItem key={n.id} n={n} />)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
