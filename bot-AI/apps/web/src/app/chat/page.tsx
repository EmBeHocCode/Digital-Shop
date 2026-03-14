'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsApiClient, webChatApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import {
  Bot,
  Clock3,
  Loader2,
  MessageCirclePlus,
  MessagesSquare,
  Send,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-react';

type ChatRole = 'user' | 'bot' | 'system';

interface ChatLine {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatLine[];
}

const STORAGE_SESSIONS_KEY = 'meow_web_chat_sessions_v2';
const STORAGE_PROFILE_CACHE_KEY = 'meow_web_chat_profile_cache_v1';
const MIN_INPUT_HEIGHT = 46;
const MAX_INPUT_HEIGHT = 180;
const MAX_SESSIONS = 80;
const MAX_MESSAGES_PER_SESSION = 200;

interface ProfileCache {
  adminDisplayName: string;
  adminAvatarUrl: string;
  botDisplayName: string;
  botAvatarUrl: string;
  updatedAt: number;
}

function createSessionId(): string {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createMessage(role: ChatRole, text: string): ChatLine {
  return {
    id: `${role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
  };
}

function createSessionTitle(index: number): string {
  return `Đoạn chat #${index}`;
}

function getNextSessionIndex(sessions: ChatSession[]): number {
  const max = sessions.reduce((acc, session) => {
    const match = session.title.match(/#(\d+)$/);
    if (!match) return acc;
    const num = Number(match[1]);
    if (!Number.isFinite(num)) return acc;
    return Math.max(acc, num);
  }, 0);
  return max + 1;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatSessionTime(ts: number): string {
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSessionPreview(session: ChatSession): string {
  const last = [...session.messages].reverse().find((m) => m.role !== 'system') ?? session.messages.at(-1);
  if (!last) return 'Chưa có tin nhắn';
  const text = last.text.replace(/\s+/g, ' ').trim();
  return text.length > 56 ? `${text.slice(0, 56).trimEnd()}...` : text;
}

function safeLoadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.id === 'string')
      .map((s) => ({
        id: String(s.id),
        title: String(s.title || 'Phiên chat'),
        createdAt: Number(s.createdAt || Date.now()),
        updatedAt: Number(s.updatedAt || Date.now()),
        messages: Array.isArray(s.messages)
          ? s.messages
              .filter((m) => m && typeof m.text === 'string')
              .map((m) => ({
                id: String(m.id || createSessionId()),
                role: (m.role === 'user' || m.role === 'bot' || m.role === 'system' ? m.role : 'system') as ChatRole,
                text: String(m.text || ''),
                createdAt: Number(m.createdAt || Date.now()),
              }))
              .slice(-MAX_MESSAGES_PER_SESSION)
          : [],
      }))
      .slice(0, MAX_SESSIONS);
  } catch {
    return [];
  }
}

function safeLoadProfileCache(): ProfileCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfileCache>;
    return {
      adminDisplayName: String(parsed.adminDisplayName || '').trim(),
      adminAvatarUrl: String(parsed.adminAvatarUrl || '').trim(),
      botDisplayName: String(parsed.botDisplayName || '').trim(),
      botAvatarUrl: String(parsed.botAvatarUrl || '').trim(),
      updatedAt: Number(parsed.updatedAt || Date.now()),
    };
  } catch {
    return null;
  }
}

const SUGGESTIONS = [
  'Tóm tắt nhanh tình trạng bot hiện tại giúp mình.',
  'Gợi ý 3 tính năng mới cho dashboard theo hướng thực tế.',
  'Viết giúp một thông báo ngắn để gửi vào nhóm lớp.',
  'Kiểm tra giúp mình checklist deploy Render.',
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sessionsHydrated, setSessionsHydrated] = useState(false);
  const [profileCache, setProfileCache] = useState<ProfileCache | null>(null);
  const [adminAvatarError, setAdminAvatarError] = useState(false);
  const [botAvatarError, setBotAvatarError] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { play: playReplySound } = useNotificationSound({
    src: '/sounds/phone-notification-leo.mp3',
    volume: 0.65,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApiClient.get();
      if (res.data?.botOffline) return null;
      return res.data.data ?? null;
    },
    staleTime: 60_000,
    retry: false,
  });

  const adminDisplayName = useMemo(() => {
    const name = settings?.profiles?.admin?.displayName?.trim();
    return name || profileCache?.adminDisplayName || 'Bạn';
  }, [settings?.profiles?.admin?.displayName, profileCache?.adminDisplayName]);

  const botDisplayName = useMemo(() => {
    const profileName = settings?.profiles?.bot?.displayName?.trim();
    const botName = settings?.bot?.name?.trim();
    return profileName || botName || profileCache?.botDisplayName || 'Meow Bot';
  }, [settings?.profiles?.bot?.displayName, settings?.bot?.name, profileCache?.botDisplayName]);

  const adminAvatarUrl = useMemo(
    () => settings?.profiles?.admin?.avatarUrl?.trim() || profileCache?.adminAvatarUrl || '',
    [settings?.profiles?.admin?.avatarUrl, profileCache?.adminAvatarUrl],
  );
  const botAvatarUrl = useMemo(
    () => settings?.profiles?.bot?.avatarUrl?.trim() || profileCache?.botAvatarUrl || '',
    [settings?.profiles?.bot?.avatarUrl, profileCache?.botAvatarUrl],
  );

  const adminFallback = useMemo(() => {
    const initials = adminDisplayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    return initials || 'B';
  }, [adminDisplayName]);

  const botFallback = useMemo(() => {
    const initials = botDisplayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    return initials || 'MB';
  }, [botDisplayName]);

  useEffect(() => {
    setSessions(safeLoadSessions());
    // Luôn vào giao diện trống, không tự mở session cũ.
    setActiveSessionId(null);
    setProfileCache(safeLoadProfileCache());
    setSessionsHydrated(true);
  }, []);

  useEffect(() => {
    if (!sessionsHydrated) return;
    try {
      const compact = sessions
        .slice(0, MAX_SESSIONS)
        .map((s) => ({ ...s, messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION) }));
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(compact));
    } catch {
      // ignore quota error
    }
  }, [sessions, sessionsHydrated]);

  useEffect(() => {
    setAdminAvatarError(false);
  }, [adminAvatarUrl]);

  useEffect(() => {
    setBotAvatarError(false);
  }, [botAvatarUrl]);

  useEffect(() => {
    const adminName = settings?.profiles?.admin?.displayName?.trim() || '';
    const adminAvatar = settings?.profiles?.admin?.avatarUrl?.trim() || '';
    const botName = settings?.profiles?.bot?.displayName?.trim() || settings?.bot?.name?.trim() || '';
    const botAvatar = settings?.profiles?.bot?.avatarUrl?.trim() || '';

    if (!adminName && !adminAvatar && !botName && !botAvatar) return;

    const nextCache: ProfileCache = {
      adminDisplayName: adminName,
      adminAvatarUrl: adminAvatar,
      botDisplayName: botName,
      botAvatarUrl: botAvatar,
      updatedAt: Date.now(),
    };

    setProfileCache(nextCache);
    try {
      localStorage.setItem(STORAGE_PROFILE_CACHE_KEY, JSON.stringify(nextCache));
    } catch {
      // ignore quota/localStorage error
    }
  }, [
    settings?.profiles?.admin?.displayName,
    settings?.profiles?.admin?.avatarUrl,
    settings?.profiles?.bot?.displayName,
    settings?.profiles?.bot?.avatarUrl,
    settings?.bot?.name,
  ]);

  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions],
  );

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  const activeMessages = activeSession?.messages ?? [];

  useEffect(() => {
    const t = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 20);
    return () => clearTimeout(t);
  }, [activeSessionId, activeMessages.length]);

  const upsertSessionMessage = (sessionId: string, role: ChatRole, text: string) => {
    const msg = createMessage(role, text);
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        const nextMessages = [...session.messages, msg].slice(-MAX_MESSAGES_PER_SESSION);
        return {
          ...session,
          updatedAt: msg.createdAt,
          messages: nextMessages,
        };
      }),
    );
  };

  const createSession = (): string => {
    const now = Date.now();
    const id = createSessionId();
    setSessions((prev) => {
      const nextIndex = getNextSessionIndex(prev);
      const next: ChatSession = {
        id,
        title: createSessionTitle(nextIndex),
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      return [next, ...prev].slice(0, MAX_SESSIONS);
    });
    setActiveSessionId(id);
    return id;
  };

  const sendMutation = useMutation({
    mutationFn: async (input: { message: string; session: string }) => {
      const res = await webChatApiClient.send({
        message: input.message,
        sessionId: input.session,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error || 'Bot chưa phản hồi');
      }
      return res.data.data;
    },
    onSuccess: (data, vars) => {
      upsertSessionMessage(vars.session, 'bot', data.reply);
      playReplySound();
    },
    onError: (error, vars) => {
      const text = error instanceof Error ? error.message : 'Không thể gửi tin nhắn tới bot';
      upsertSessionMessage(vars.session, 'system', `Lỗi: ${text}`);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async (id: string) => {
      await webChatApiClient.clearSession(id);
    },
  });

  const isBusy = sendMutation.isPending;
  const canSend = draft.trim().length > 0 && !isBusy;

  const resizeInput = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const next = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, el.scrollHeight));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const el = inputRef.current;
    if (el) resizeInput(el);
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    resizeInput(el);
  }, [draft]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || isBusy) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = createSession();
    }

    upsertSessionMessage(targetSessionId, 'user', text);
    setDraft('');
    sendMutation.mutate({ message: text, session: targetSessionId });
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setDraft('');
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
    clearMutation.mutate(id);
  };

  const statusText = useMemo(() => {
    if (isBusy) return 'Bot đang suy nghĩ...';
    if (activeSession) return `Đang mở: ${activeSession.title}`;
    return 'Sẵn sàng trò chuyện';
  }, [isBusy, activeSession]);

  const renderRoleAvatar = (role: ChatRole) => {
    if (role === 'system') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20">
          <Bot className="h-3.5 w-3.5" />
        </span>
      );
    }

    if (role === 'user') {
      if (adminAvatarUrl && !adminAvatarError) {
        return (
          <img
            src={adminAvatarUrl}
            alt={adminDisplayName}
            className="w-5 h-5 rounded-full object-cover border border-border/60"
            onError={() => setAdminAvatarError(true)}
          />
        );
      }
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#58CC02]/25 text-[10px] font-bold">
          {adminFallback}
        </span>
      );
    }

    if (botAvatarUrl && !botAvatarError) {
      return (
        <img
          src={botAvatarUrl}
          alt={botDisplayName}
          className="w-5 h-5 rounded-full object-cover border border-border/60"
          onError={() => setBotAvatarError(true)}
        />
      );
    }

    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1CB0F6]/20 text-[10px] font-bold">
        {botFallback}
      </span>
    );
  };

  return (
    <div className="w-[90%] max-w-[1400px] mx-auto h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] flex flex-col gap-4 overflow-hidden">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#58CC02] text-white shadow-[0_4px_0_0_#46A302]">
            <MessagesSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
            <p className="text-muted-foreground font-medium">Mở trống khi vào lại, chọn session để tiếp tục chat cũ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#58CC02]/10 text-[#58CC02] border border-[#58CC02]/30 max-w-[320px] truncate">
            <Sparkles className="h-3 w-3 mr-1 shrink-0" />
            {statusText}
          </Badge>
          <Button
            variant="outline"
            className="rounded-xl border-2"
            onClick={handleNewChat}
          >
            <MessageCirclePlus className="h-4 w-4 mr-2" />
            Chat mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] flex-1 min-h-0">
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden min-h-0 flex flex-col">
          <div className="px-4 py-3 border-b border-border/70 bg-muted/20 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {activeSession ? (
                <>Session: <span className="font-mono text-foreground">{activeSession.id}</span></>
              ) : (
                <>Session: <span className="text-foreground">chưa chọn (màn hình trống)</span></>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Nhấn Enter để gửi, Shift+Enter để xuống dòng</div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {!activeSession ? (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-4">
                  <MessagesSquare className="h-7 w-7" />
                </div>
                <p className="text-2xl font-semibold mb-2">Bắt đầu cuộc trò chuyện mới</p>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Chọn một session bên phải để mở lại đoạn chat cũ, hoặc nhập tin nhắn để tạo session mới.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {activeMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isSystem = msg.role === 'system';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                          isUser
                            ? 'bg-[#58CC02]/15 border-[#58CC02]/30 text-foreground'
                            : isSystem
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-background/70 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {renderRoleAvatar(msg.role)}
                          <span className="text-xs font-semibold">
                            {isUser ? adminDisplayName : isSystem ? 'Hệ thống' : botDisplayName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {isBusy && activeSession && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 border bg-background/70 border-border flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {botDisplayName} đang soạn phản hồi...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border/70 bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  activeSession
                    ? `Nhắn tiếp trong "${activeSession.title}"...`
                    : `Nhắn để tạo session mới với ${botDisplayName}...`
                }
                className="h-[46px] min-h-[46px] max-h-[180px] rounded-2xl border-2 resize-none px-4 py-3 leading-6"
              />
              <Button
                onClick={handleSend}
                disabled={!canSend}
                className="shrink-0 h-11 w-11 rounded-full bg-[#58CC02] hover:bg-[#46A302] text-black p-0 shadow-[0_3px_0_0_#2f7500]"
              >
                {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 min-h-0">
          <div className="rounded-2xl border-2 border-border bg-card p-4 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-[#1CB0F6]" />
                <p className="text-sm font-semibold">Sessions đã lưu</p>
              </div>
              <Badge variant="secondary">{orderedSessions.length}</Badge>
            </div>

            {orderedSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
                Chưa có session nào. Gửi tin nhắn đầu tiên để tạo session.
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0 h-[260px] pr-1">
                <div className="space-y-2">
                  {orderedSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <div key={session.id} className="group flex items-stretch gap-2">
                        <button
                          type="button"
                          className={`flex-1 text-left rounded-xl border p-3 transition-colors ${
                            isActive
                              ? 'border-[#1CB0F6]/60 bg-[#1CB0F6]/10'
                              : 'border-border bg-background/40 hover:border-[#1CB0F6]/40'
                          }`}
                          onClick={() => setActiveSessionId(session.id)}
                        >
                          <p className="text-sm font-semibold truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{getSessionPreview(session)}</p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            <span>{formatSessionTime(session.updatedAt)}</span>
                          </div>
                        </button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-auto rounded-xl border hover:border-red-500/50 hover:text-red-400"
                          onClick={() => handleDeleteSession(session.id)}
                          title="Xóa session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <WandSparkles className="h-4 w-4 text-[#1CB0F6]" />
              <p className="text-sm font-semibold">Gợi ý nhanh</p>
            </div>
            <div className="space-y-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="w-full text-left text-sm rounded-xl border border-border bg-background/40 px-3 py-2.5 hover:border-[#1CB0F6]/40 hover:bg-[#1CB0F6]/5 transition-colors"
                  onClick={() => handleDraftChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
