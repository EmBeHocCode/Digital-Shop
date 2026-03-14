'use client';

import { useQuery } from '@tanstack/react-query';
import { historyApiClient, groupsApiClient, contactsApiClient, type ResolvedInfo } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Clock, Users, User } from 'lucide-react';
import { useMemo, useState } from 'react';

type ThreadInfo = {
  name: string;
  type: 'group' | 'user' | 'unknown';
  avatar: string;
};

function ThreadAvatar({ info, threadId }: { info: ThreadInfo; threadId: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = (info.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500','bg-red-500'];
  const colorIdx = threadId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  if (info.avatar && !imgError) {
    return (
      <img
        src={info.avatar}
        alt={info.name}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${colors[colorIdx]}`}>
      {info.type === 'unknown' ? '#' : initials}
    </div>
  );
}

export default function HistoryPage() {
  const { data: threads, isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const res = await historyApiClient.getThreads(50);
      return res.data.data ?? [];
    },
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

  // Build lookup map: threadId/userId → ThreadInfo
  const nameMap = useMemo(() => {
    const map = new Map<string, ThreadInfo>();
    for (const g of groups ?? []) {
      map.set(g.id, { name: g.name, type: 'group', avatar: g.avatar });
    }
    for (const c of contacts ?? []) {
      if (!map.has(c.userId)) {
        map.set(c.userId, { name: c.displayName, type: 'user', avatar: c.avatar });
      }
    }
    return map;
  }, [groups, contacts]);

  // Tìm các ID chưa có tên để resolve thêm
  const unknownIds = useMemo(() => {
    if (!threads) return [];
    return threads.filter((t) => !nameMap.has(t.thread_id)).map((t) => t.thread_id);
  }, [threads, nameMap]);

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

  const getInfo = (threadId: string): ThreadInfo => {
    if (nameMap.has(threadId)) return nameMap.get(threadId)!;
    const r = resolved?.[threadId];
    if (r?.name) return { name: r.name, type: r.type as ThreadInfo['type'], avatar: r.avatar };
    return { name: '', type: 'unknown', avatar: '' };
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1CB0F6] text-white shadow-[0_4px_0_0_#1899D6]">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch sử</h1>
          <p className="text-muted-foreground font-medium">Lịch sử hội thoại với bot</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b-2 border-border">
          <div className="col-span-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Users className="h-4 w-4" />
            Cuộc hội thoại
          </div>
          <div className="col-span-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <MessageSquare className="h-4 w-4" />
            Tin nhắn
          </div>
          <div className="col-span-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Clock className="h-4 w-4" />
            Hoạt động
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y-2 divide-border">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-xl flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted rounded-lg" />
                    <div className="h-3 w-24 bg-muted rounded-lg" />
                  </div>
                </div>
                <div className="col-span-3 flex items-center">
                  <div className="h-7 w-16 bg-muted rounded-full" />
                </div>
                <div className="col-span-3 flex items-center">
                  <div className="h-5 w-24 bg-muted rounded-lg" />
                </div>
              </div>
            ))
          ) : threads?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Chưa có lịch sử hội thoại</p>
              <p className="text-sm text-muted-foreground mt-1">Các cuộc hội thoại sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            threads?.map((thread, index) => {
              const info = getInfo(thread.thread_id);
              return (
                <div
                  key={thread.thread_id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Thread identity */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <ThreadAvatar info={info} threadId={thread.thread_id} />
                    <div className="min-w-0 flex-1">
                      {info.name ? (
                        <>
                          <p className="text-sm font-semibold truncate group-hover:text-[#1CB0F6] transition-colors">
                            {info.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {thread.thread_id}
                          </p>
                        </>
                      ) : (
                        <code className="text-sm font-mono font-medium group-hover:text-[#1CB0F6] transition-colors">
                          {thread.thread_id}
                        </code>
                      )}
                    </div>
                    {/* Type badge */}
                    {info.type === 'group' && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-medium text-purple-400">
                        <Users className="h-3 w-3" />
                        Nhóm
                      </span>
                    )}
                    {info.type === 'user' && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-xs font-medium text-green-400">
                        <User className="h-3 w-3" />
                        DM
                      </span>
                    )}
                  </div>

                  {/* Message count */}
                  <div className="col-span-3 flex items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 text-sm font-semibold text-[#1CB0F6]">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {thread.message_count}
                    </span>
                  </div>

                  {/* Last activity */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {formatRelativeTime(thread.last_message)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
