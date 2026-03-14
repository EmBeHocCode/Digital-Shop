'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { settingsApiClient } from '@/lib/api';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Power, Loader2 } from 'lucide-react';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useBotStatusContext } from '@/components/providers/bot-status-provider';
import { useNotificationSound } from '@/hooks/use-notification-sound';

export function Header() {
  const { running, online, toggling, toggle: toggleBot } = useBotStatusContext();
  const isTransitioning = toggling;
  const router = useRouter();
  const { play: playClick } = useNotificationSound({ src: '/sounds/click.mp3', volume: 0.5 });
  const handleBotButton = () => { playClick(); if (!running) { router.push('/bot'); } else { toggleBot(); } };
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApiClient.get();
      if (res.data?.botOffline) return null;
      return res.data.data ?? null;
    },
    staleTime: 60000,
    retry: false,
  });

  const adminAvatarUrl = settings?.profiles?.admin?.avatarUrl || null;
  const avatarFallback = useMemo(() => {
    const displayName = settings?.profiles?.admin?.displayName?.trim();
    if (!displayName) return 'AD';
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('');
    return initials || 'AD';
  }, [settings?.profiles?.admin?.displayName]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-muted transition-colors" />

        <div className="flex-1" />

        {/* Bot reply toggle */}
        <button
          onClick={handleBotButton}
          disabled={isTransitioning}
          title={
            !running ? 'Bot chưa khởi động — bấm để mở Bot Terminal'
            : online ? 'Bot đang reply Zalo — bấm để tắt'
            : 'Bot đang im lặng — bấm để bật reply'
          }
          className={
            `relative flex items-center gap-2 h-9 px-3 rounded-xl border font-semibold text-xs transition-all select-none
            ${
              !running
                ? 'border-border/30 text-muted-foreground/40 cursor-not-allowed'
                : isTransitioning
                ? 'border-[#FF9600]/50 text-[#FF9600] bg-[#FF9600]/10 cursor-wait'
                : online
                ? 'border-[#58CC02]/60 text-[#58CC02] bg-[#58CC02]/10 hover:bg-[#58CC02]/20 shadow-[0_0_10px_rgba(88,204,2,0.2)]'
                : 'border-border/40 text-muted-foreground hover:border-[#ff006e]/50 hover:text-[#ff006e] hover:bg-[#ff006e]/10'
            }`
          }
        >
          {isTransitioning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Power className={`h-3.5 w-3.5 ${online ? 'drop-shadow-[0_0_4px_#58CC02]' : ''}`} />
          )}
          <span>{!running ? 'Offline' : isTransitioning ? '...' : online ? 'Online' : 'Offline'}</span>
          {running && online && !isTransitioning && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#58CC02] animate-pulse" />
          )}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <button
          onClick={() => router.push('/profile')}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-[#ff006e] text-white font-bold text-sm shadow-[0_3px_0_0_#cc0055] hover:shadow-[0_2px_0_0_#cc0055] hover:translate-y-[1px] transition-all"
          title="Mở trang hồ sơ"
        >
          {adminAvatarUrl ? (
            <img src={adminAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            avatarFallback
          )}
        </button>
      </div>
    </header>
  );
}
