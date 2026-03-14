'use client';

import { useQuery } from '@tanstack/react-query';
import { statsApi, groupsApiClient, contactsApiClient } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime, formatNumber } from '@/lib/utils';
import { MessageSquare, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

function ThreadAvatar({ name, threadId, avatar }: { name: string; threadId: string; avatar?: string }) {
  const [imgError, setImgError] = useState(false);
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500','bg-red-500'];
  const colorIdx = threadId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const initials = name ? name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '#';

  if (avatar && !imgError) {
    return <img src={avatar} alt={name} onError={() => setImgError(true)} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />;
  }
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${colors[colorIdx]}`}>
      {initials}
    </div>
  );
}

export function ActiveThreads() {
  const { data, isLoading } = useQuery({
    queryKey: ['active-threads'],
    queryFn: async () => {
      const res = await statsApi.getActiveThreads(10);
      if (res.data?.botOffline) return null;
      return res.data.data ?? null;
    },
    retry: false,
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await groupsApiClient.getAll();
      return res.data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsApiClient.getAll();
      return res.data.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const nameMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    for (const g of groups ?? []) map.set(g.id, { name: g.name, avatar: g.avatar });
    for (const c of contacts ?? []) if (!map.has(c.userId)) map.set(c.userId, { name: c.displayName, avatar: c.avatar });
    return map;
  }, [groups, contacts]);

  // Resolve các ID chưa có tên
  const unknownIds = useMemo(() => {
    if (!data) return [];
    return data.filter((t) => !nameMap.has(t.thread_id)).map((t) => t.thread_id);
  }, [data, nameMap]);

  const { data: resolved } = useQuery({
    queryKey: ['resolve-threads', unknownIds],
    queryFn: async () => {
      if (unknownIds.length === 0) return {};
      const res = await groupsApiClient.resolve(unknownIds);
      return res.data.data ?? {};
    },
    enabled: unknownIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const getInfo = (threadId: string) => {
    if (nameMap.has(threadId)) return nameMap.get(threadId)!;
    const r = resolved?.[threadId];
    if (r?.name) return { name: r.name, avatar: r.avatar };
    return null;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded-lg" />
                <div className="h-3 w-24 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data === null || data === undefined) {
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-muted-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Threads hoạt động</h3>
            <p className="text-xs text-muted-foreground/60">Bật bot để xem dữ liệu</p>
          </div>
        </div>
        <div className="h-48 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground/50 text-sm">Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Threads hoạt động</h3>
          <p className="text-sm text-muted-foreground">Top 10 threads nhiều tin nhắn nhất</p>
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="h-[320px] pr-4">
        <div className="space-y-3">
          {data?.map((thread, index) => {
              const info = getInfo(thread.thread_id);
              return (
            <div
              key={thread.thread_id}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              {/* Rank Badge */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm flex-shrink-0 ${
                  index === 0
                    ? 'bg-[#FFD700] text-[#8B6914] shadow-[0_3px_0_0_#D4AF37]'
                    : index === 1
                      ? 'bg-[#C0C0C0] text-[#5A5A5A] shadow-[0_3px_0_0_#A0A0A0]'
                      : index === 2
                        ? 'bg-[#CD7F32] text-white shadow-[0_3px_0_0_#A0522D]'
                        : 'bg-muted text-muted-foreground border-2 border-border'
                }`}
              >
                {index + 1}
              </div>

              {/* Thread Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {info && <ThreadAvatar name={info.name} threadId={thread.thread_id} avatar={info.avatar} />}
                <div className="min-w-0">
                  {info?.name ? (
                    <>
                      <p className="text-sm font-semibold truncate group-hover:text-[#1CB0F6] transition-colors">
                        {info.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {formatRelativeTime(thread.last_activity)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold truncate font-mono group-hover:text-[#1CB0F6] transition-colors">
                        {thread.thread_id.slice(-16)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(thread.last_activity)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Message Count */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1CB0F6]/10 border border-[#1CB0F6]/30">
                <MessageSquare className="h-3.5 w-3.5 text-[#1CB0F6]" />
                <span className="text-sm font-semibold text-[#1CB0F6]">
                  {formatNumber(thread.message_count)}
                </span>
              </div>
            </div>
              );
            })}

          {(!data || data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Chưa có thread nào</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
