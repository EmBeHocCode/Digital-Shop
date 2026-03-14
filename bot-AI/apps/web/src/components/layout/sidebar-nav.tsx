'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { settingsApiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBotStatusContext } from '@/components/providers/bot-status-provider';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Brain,
  ListTodo,
  Settings,
  FileText,
  Bot,
  HardDrive,
  Key,
  BookText,
  Terminal,
  User,
  QrCode,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';

const navItems = [
  {
    title: 'Tổng quan',
    href: '/',
    icon: LayoutDashboard,
    color: 'text-[#ff006e]',
    bgColor: 'bg-[#ff006e]/10',
  },
  {
    title: 'Hồ sơ',
    href: '/profile',
    icon: User,
    color: 'text-[#CE82FF]',
    bgColor: 'bg-[#CE82FF]/10',
  },
  {
    title: 'Lịch sử',
    href: '/history',
    icon: MessageSquare,
    color: 'text-[#1CB0F6]',
    bgColor: 'bg-[#1CB0F6]/10',
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: MessagesSquare,
    color: 'text-[#58CC02]',
    bgColor: 'bg-[#58CC02]/10',
  },
  {
    title: 'Bộ nhớ',
    href: '/memories',
    icon: Brain,
    color: 'text-[#CE82FF]',
    bgColor: 'bg-[#CE82FF]/10',
  },
  {
    title: 'Tác vụ',
    href: '/tasks',
    icon: ListTodo,
    color: 'text-[#FF9600]',
    bgColor: 'bg-[#FF9600]/10',
  },
  {
    title: 'Lệnh Bot',
    href: '/commands',
    icon: BookText,
    color: 'text-[#FF9600]',
    bgColor: 'bg-[#FF9600]/10',
  },
  {
    title: 'Nhật ký',
    href: '/logs',
    icon: FileText,
    color: 'text-[#a0a0a0]',
    bgColor: 'bg-[#a0a0a0]/10',
  },
  {
    title: 'Bot Terminal',
    href: '/bot',
    icon: Terminal,
    color: 'text-[#58CC02]',
    bgColor: 'bg-[#58CC02]/10',
  },
  {
    title: 'Đăng nhập QR',
    href: '/zalo-login',
    icon: QrCode,
    color: 'text-[#1CB0F6]',
    bgColor: 'bg-[#1CB0F6]/10',
  },
  {
    title: 'Backup',
    href: '/backup',
    icon: HardDrive,
    color: 'text-[#FF4B4B]',
    bgColor: 'bg-[#FF4B4B]/10',
  },
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
    color: 'text-[#a0a0a0]',
    bgColor: 'bg-[#a0a0a0]/10',
  },
  {
    title: 'API Keys',
    href: '/env-keys',
    icon: Key,
    color: 'text-[#ff006e]',
    bgColor: 'bg-[#ff006e]/10',
  },
];

function BotStatusFooter({ avatarUrl }: { avatarUrl: string | null }) {
  const { running, online, toggling, toggle } = useBotStatusContext();

  const label = !running ? 'Bot chưa khởi động' : online ? 'Bot đang hoạt động' : 'Bot đang im lặng';
  const sublabel = !running ? 'Chạy bot để dùng web' : online ? 'Reply Zalo · Bấm để tắt' : 'Không reply · Bấm để bật';
  const dotColor = !running ? 'bg-muted-foreground/30' : online ? 'bg-[#58CC02] animate-pulse' : 'bg-[#FF9600] animate-pulse';
  const borderColor = !running ? 'bg-muted/30 border-muted' : online ? 'bg-[#58CC02]/10 border-[#58CC02]/30 hover:bg-[#58CC02]/20' : 'bg-[#FF9600]/10 border-[#FF9600]/30 hover:bg-[#FF9600]/20';
  const avatarBg = !running ? 'bg-muted-foreground/40' : online ? 'bg-[#58CC02] shadow-[0_2px_0_0_#46A302]' : 'bg-[#FF9600]';
  const textColor = !running ? 'text-muted-foreground' : online ? 'text-[#58CC02]' : 'text-[#FF9600]';

  const router = useRouter();
  const { play: playClick } = useNotificationSound({ src: '/sounds/click.mp3', volume: 0.5 });
  const handleClick = () => { playClick(); if (!running) { router.push('/bot'); } else { toggle(); } };

  return (
    <button
      onClick={handleClick}
      disabled={toggling}
      title={label}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${borderColor}`}
    >
      <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-white ${avatarBg}`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${textColor}`}>{label}</p>
        <p className="text-xs text-muted-foreground/70">{sublabel}</p>
      </div>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
    </button>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { play: playClick } = useNotificationSound({ src: '/sounds/click.mp3', volume: 0.5 });
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
  const botName = settings?.bot?.name || 'Meow';
  const botAvatarUrl =
    typeof settings?.profiles === 'object' &&
    settings.profiles &&
    typeof (settings.profiles as { bot?: { avatarUrl?: unknown } }).bot?.avatarUrl === 'string'
      ? (settings.profiles as { bot: { avatarUrl: string } }).bot.avatarUrl
      : null;

  return (
    <Sidebar className="border-r-2 border-border">
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ff006e] text-white shadow-[0_3px_0_0_#cc0055] group-hover:shadow-[0_2px_0_0_#cc0055] group-hover:translate-y-[1px] transition-all">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">{botName}</span>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'h-11 rounded-xl font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[#ff006e] text-white shadow-[0_3px_0_0_#cc0055] hover:bg-[#ff006e] hover:text-white'
                          : 'hover:bg-muted'
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3" onClick={playClick}>
                        <div
                          className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                            isActive ? 'bg-white/20' : item.bgColor
                          )}
                        >
                          <item.icon
                            className={cn('h-4 w-4', isActive ? 'text-white' : item.color)}
                          />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4">
        <BotStatusFooter avatarUrl={botAvatarUrl} />
      </SidebarFooter>
    </Sidebar>
  );
}
