'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApiClient, settingsApiClient, type BotSettings, type ZaloContact } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  AlertTriangle,
  RefreshCw,
  Bot,
  Puzzle,
  Wrench,
  Zap,
  Shield,
  MessageSquare,
  Brain,
  Moon,
  Cloud,
  Clock,
  Copy,
  Database,
  Download,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { GroupPicker } from '@/components/dashboard/group-picker';
import { useState, useEffect, useRef } from 'react';

const VALID_TABS = ['general', 'modes', 'ai', 'modules', 'performance', 'access', 'advanced'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<BotSettings | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window === 'undefined') return 'general';
    const saved = localStorage.getItem('settings-tab');
    // Migrate old key names
    if (saved === 'advanced') return 'access';
    return (VALID_TABS as readonly string[]).includes(saved ?? '') ? (saved as SettingsTab) : 'general';
  });

  // Ref để force-sync localSettings khi user bấm "Tải lại"
  const pendingSyncRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const latestSettingsRef = useRef<BotSettings | null>(null);
  const autoSaveInFlightRef = useRef(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as SettingsTab);
    localStorage.setItem('settings-tab', tab);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApiClient.get();
      return res.data.data;
    },
    // Tắt auto-refetch để tránh ghi đè localSettings khi user đang chỉnh mà chưa lưu
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsApiClient.getAll();
      const list = res.data.data ?? [];
      return [...list].sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'));
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    // Chỉ sync khi: lần đầu load (localSettings null) HOẶC user bấm "Tải lại" (pendingSyncRef)
    if (data && (!localSettings || pendingSyncRef.current)) {
      lastSavedSnapshotRef.current = JSON.stringify(data);
      latestSettingsRef.current = data;
      setLocalSettings(data);
      pendingSyncRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const showSettingsSaveError = (error: unknown, fallbackTitle: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiError = (error as any)?.response?.data;
    if (apiError?.details?.length > 0) {
      const issues = apiError.details as Array<{ path: string[]; message: string }>;
      const msgs = issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
      toast.error('Validation lỗi', { description: msgs });
      return;
    }
    toast.error(fallbackTitle, { description: apiError?.error || 'Unknown error' });
  };

  const runAutoSave = async () => {
    const current = latestSettingsRef.current;
    if (!current) return;

    const snapshot = JSON.stringify(current);
    if (snapshot === lastSavedSnapshotRef.current || autoSaveInFlightRef.current) return;

    autoSaveInFlightRef.current = true;
    setIsAutoSaving(true);
    try {
      await settingsApiClient.update(current);
      lastSavedSnapshotRef.current = snapshot;
      queryClient.setQueryData(['settings'], current);
    } catch (error: unknown) {
      showSettingsSaveError(error, 'Lỗi khi tự lưu settings');
    } finally {
      autoSaveInFlightRef.current = false;
      setIsAutoSaving(false);
    }
  };

  const scheduleAutoSave = (delayMs = 900) => {
    if (autoSaveTimeoutRef.current !== null) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      autoSaveTimeoutRef.current = null;
      void runAutoSave();
    }, delayMs);
  };

  const autoSaveSection = (key: string, data: unknown, errorTitle: string) => {
    void settingsApiClient
      .updateSection(key, data)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ['settings'] });
      })
      .catch((error: unknown) => {
        showSettingsSaveError(error, errorTitle);
      });
  };

  const reloadMutation = useMutation({
    mutationFn: () => settingsApiClient.reload(),
    onSuccess: () => {
      // Đánh dấu cần sync rồi mới invalidate, để useEffect sẽ ghi đè localSettings
      pendingSyncRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Đã reload settings');
    },
    onError: () => toast.error('Lỗi khi reload settings'),
  });

  const refreshContactsMutation = useMutation({
    mutationFn: () => contactsApiClient.refresh(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Đã làm mới danh sách bạn bè');
    },
    onError: () => toast.error('Lỗi khi làm mới danh sách bạn bè'),
  });

  useEffect(() => {
    if (!localSettings) return;
    latestSettingsRef.current = localSettings;
    const snapshot = JSON.stringify(localSettings);
    if (snapshot !== lastSavedSnapshotRef.current) {
      scheduleAutoSave();
    }
  }, [localSettings]);

  useEffect(() => {
    const flushAutoSaveSoon = () => {
      if (autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      window.setTimeout(() => {
        void runAutoSave();
      }, 0);
    };

    const handlePointerDown = () => {
      flushAutoSaveSoon();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.isComposing) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      flushAutoSaveSoon();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (autoSaveTimeoutRef.current !== null) {
        window.clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, []);

  // Update helpers
  const updateBotSetting = <K extends keyof BotSettings['bot']>(key: K, value: BotSettings['bot'][K]) => {
    if (!localSettings) return;
    const nextBot = { ...localSettings.bot, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: nextBot,
    });
    if (typeof value === 'boolean') {
      autoSaveSection('bot', { [key]: value }, 'Lỗi khi tự lưu cài đặt bot');
    }
  };

  const updateModule = (key: string, value: boolean) => {
    if (!localSettings) return;
    const nextModules = { ...localSettings.modules, [key]: value };
    setLocalSettings({
      ...localSettings,
      modules: nextModules,
    });
    autoSaveSection('modules', { [key]: value }, 'Lỗi khi tự lưu module');
  };

  const updateMaintenanceMode = (key: 'enabled' | 'message', value: boolean | string) => {
    if (!localSettings) return;
    const currentMaintenance = localSettings.bot.maintenanceMode ?? {
      enabled: false,
      message: '🔧 Bot đang trong chế độ bảo trì. Vui lòng thử lại sau!',
    };
    const nextMaintenance = { ...currentMaintenance, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        maintenanceMode: nextMaintenance,
      },
    });
    if (key === 'enabled') {
      autoSaveSection('bot', { maintenanceMode: nextMaintenance }, 'Lỗi khi tự lưu chế độ bảo trì');
    }
  };

  const updateSleepMode = <K extends keyof BotSettings['bot']['sleepMode']>(
    key: K,
    value: BotSettings['bot']['sleepMode'][K]
  ) => {
    if (!localSettings) return;
    const currentSleep = localSettings.bot.sleepMode ?? {
      enabled: false,
      sleepHour: 23,
      wakeHour: 6,
      checkIntervalMs: 60000,
    };
    const nextSleep = { ...currentSleep, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        sleepMode: nextSleep,
      },
    });
    if (key === 'enabled') {
      autoSaveSection('bot', { sleepMode: nextSleep }, 'Lỗi khi tự lưu chế độ ngủ');
    }
  };

  const updateCloudDebug = <K extends keyof BotSettings['bot']['cloudDebug']>(
    key: K,
    value: BotSettings['bot']['cloudDebug'][K]
  ) => {
    if (!localSettings) return;
    const currentCloudDebug = localSettings.bot.cloudDebug ?? {
      enabled: true,
      prefix: '#bot',
      matchAnyHash: false,
    };
    const nextCloudDebug = { ...currentCloudDebug, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        cloudDebug: nextCloudDebug,
      },
    });
    if (typeof value === 'boolean') {
      autoSaveSection('bot', { cloudDebug: nextCloudDebug }, 'Lỗi khi tự lưu cloud debug');
    }
  };

  const updateStrangerAutoReply = <K extends keyof BotSettings['bot']['strangerAutoReply']>(
    key: K,
    value: BotSettings['bot']['strangerAutoReply'][K]
  ) => {
    if (!localSettings) return;
    const current = localSettings.bot.strangerAutoReply ?? {
      enabled: false,
      message:
        'Em là bot tự động của anh Hùng. Hiện tại anh có thể đang bận, mong anh/chị chờ một chút ạ.',
      cooldownMs: 600000,
      dailyLimit: 1,
    };
    const nextStrangerAutoReply = { ...current, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        strangerAutoReply: nextStrangerAutoReply,
      },
    });
    if (key === 'enabled') {
      autoSaveSection('bot', { strangerAutoReply: nextStrangerAutoReply }, 'Lỗi khi tự lưu auto-reply người lạ');
    }
  };

  const updateFriendDmReplyEnabled = (value: boolean) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        friendDmReplyEnabled: value,
      },
    });
    autoSaveSection('bot', { friendDmReplyEnabled: value }, 'Lỗi khi tự lưu bật/tắt rep tin nhắn riêng người quen');
  };

  const updatePrivateAutoReply = <K extends keyof BotSettings['bot']['privateAutoReply']>(
    key: K,
    value: BotSettings['bot']['privateAutoReply'][K]
  ) => {
    if (!localSettings) return;
    const current = localSettings.bot.privateAutoReply ?? {
      enabled: false,
      message: 'Dạ em đã nhận được tin nhắn riêng của anh/chị rồi nhé, em phản hồi theo mẫu cài đặt này trước ạ.',
      cooldownMs: 600000,
      dailyLimit: 3,
    };
    const nextPrivateAutoReply = { ...current, [key]: value };
    setLocalSettings({
      ...localSettings,
      bot: {
        ...localSettings.bot,
        privateAutoReply: nextPrivateAutoReply,
      },
    });
    if (key === 'enabled') {
      autoSaveSection('bot', { privateAutoReply: nextPrivateAutoReply }, 'Lỗi khi tự lưu auto-reply mọi tin nhắn riêng');
    }
  };

  const updateGemini = <K extends keyof BotSettings['gemini']>(key: K, value: BotSettings['gemini'][K]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      gemini: { ...localSettings.gemini, [key]: value },
    });
  };

  const updateGroqModels = <K extends keyof BotSettings['groqModels']>(key: K, value: BotSettings['groqModels'][K]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      groqModels: { ...localSettings.groqModels, [key]: value },
    });
  };

  const updateBuffer = <K extends keyof BotSettings['buffer']>(key: K, value: BotSettings['buffer'][K]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      buffer: { ...localSettings.buffer, [key]: value },
    });
  };

  const updateHistory = <K extends keyof BotSettings['history']>(key: K, value: BotSettings['history'][K]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      history: { ...localSettings.history, [key]: value },
    });
  };

  const updateMemory = <K extends keyof BotSettings['memory']>(key: K, value: BotSettings['memory'][K]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      memory: { ...localSettings.memory, [key]: value },
    });
  };

  const updateCloudBackup = <K extends keyof BotSettings['cloudBackup']>(key: K, value: BotSettings['cloudBackup'][K]) => {
    if (!localSettings) return;
    const nextCloudBackup = { ...localSettings.cloudBackup, [key]: value };
    setLocalSettings({
      ...localSettings,
      cloudBackup: nextCloudBackup,
    });
    if (key === 'enabled') {
      autoSaveSection('cloudBackup', { [key]: value }, 'Lỗi khi tự lưu cloud backup');
    }
  };

  const updateBackgroundAgent = <K extends keyof BotSettings['backgroundAgent']>(
    key: K,
    value: BotSettings['backgroundAgent'][K]
  ) => {
    if (!localSettings) return;
    const nextBackgroundAgent = { ...localSettings.backgroundAgent, [key]: value };
    setLocalSettings({
      ...localSettings,
      backgroundAgent: nextBackgroundAgent,
    });
    if (typeof value === 'boolean') {
      autoSaveSection('backgroundAgent', { [key]: value }, 'Lỗi khi tự lưu background agent');
    }
  };

  const updateCommandAccess = <K extends keyof BotSettings['commandAccess']>(
    key: K,
    value: BotSettings['commandAccess'][K]
  ) => {
    if (!localSettings) return;
    const current = localSettings.commandAccess ?? {
      commandsEnabled: true,
      respectGlobalAccessLists: false,
      additionalAdminUserIds: [],
      nonAdminAllowedCommands: [],
      denyMessage: '⛔ Bạn không có quyền sử dụng lệnh này.',
    };
    setLocalSettings({
      ...localSettings,
      commandAccess: { ...current, [key]: value },
    });
    if (typeof value === 'boolean') {
      autoSaveSection('commandAccess', { [key]: value }, 'Lỗi khi tự lưu phân quyền lệnh');
    }
  };

  const updateAllowedUserIds = (value: string) => {
    if (!localSettings) return;
    const ids = value.split('\n').map((id) => id.trim()).filter(Boolean);
    setLocalSettings({
      ...localSettings,
      allowedUserIds: ids,
    });
  };

  const addAllowedUserId = (userId: string) => {
    if (!localSettings) return;
    const current = localSettings.allowedUserIds ?? [];
    if (current.includes(userId)) {
      toast.info('ID này đã có trong Allowed User IDs');
      return;
    }
    setLocalSettings({
      ...localSettings,
      allowedUserIds: [...current, userId],
    });
    toast.success('Đã thêm ID vào Allowed User IDs');
  };

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Không thể copy. Bạn thử lại giúp mình.');
    }
  };

  const exportContactIds = (list: ZaloContact[]) => {
    if (list.length === 0) {
      toast.error('Không có bạn bè để xuất ID');
      return;
    }
    const content = list.map((c) => c.userId).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zalo-friend-ids-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file ID bạn bè');
  };

  const updateAllowedGroups = async (value: { allowAll: boolean; ids: string[] }) => {
    if (!localSettings) return false;
    try {
      await settingsApiClient.updateSection('allowAllGroups', value.allowAll);
      await settingsApiClient.updateSection('allowedGroupIds', value.ids);
      setLocalSettings((prev) =>
        prev ? { ...prev, allowAllGroups: value.allowAll, allowedGroupIds: value.ids } : prev
      );
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      return true;
    } catch (error: unknown) {
      showSettingsSaveError(error, 'Lỗi khi lưu nhóm được phép');
      return false;
    }
  };

  if (isLoading || !localSettings) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-muted rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-[500px] bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const normalizedContactSearch = contactSearch.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => {
    if (!normalizedContactSearch) return true;
    return (
      c.displayName.toLowerCase().includes(normalizedContactSearch) ||
      c.userId.toLowerCase().includes(normalizedContactSearch)
    );
  });

  const commandAccess = localSettings.commandAccess ?? {
    commandsEnabled: true,
    respectGlobalAccessLists: false,
    additionalAdminUserIds: [],
    nonAdminAllowedCommands: [],
    denyMessage: '⛔ Bạn không có quyền sử dụng lệnh này.',
  };


  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#777777] text-white shadow-[0_4px_0_0_#5A5A5A]">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
            <p className="text-muted-foreground font-medium">Cấu hình bot</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => reloadMutation.mutate()}
              disabled={reloadMutation.isPending}
              className="h-11 px-4 rounded-xl border-2 font-semibold hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reloadMutation.isPending ? 'animate-spin' : ''}`} />
              Tải lại
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {isAutoSaving
              ? 'Đang tự lưu thay đổi...'
              : 'Nút gạt/tích chọn lưu ngay. Ô nhập text/số tự lưu khi Enter hoặc click ra ngoài.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-auto p-1 rounded-xl bg-muted border-2 border-border flex-wrap gap-1">
          <TabsTrigger value="general" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bot className="h-4 w-4 mr-2" />
            Cơ bản
          </TabsTrigger>
          <TabsTrigger value="modes" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Moon className="h-4 w-4 mr-2" />
            Chế độ
          </TabsTrigger>
          <TabsTrigger value="ai" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Brain className="h-4 w-4 mr-2" />
            AI
          </TabsTrigger>
          <TabsTrigger value="modules" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Puzzle className="h-4 w-4 mr-2" />
            Mô-đun
          </TabsTrigger>
          <TabsTrigger value="performance" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Zap className="h-4 w-4 mr-2" />
            Hiệu năng
          </TabsTrigger>
          <TabsTrigger value="access" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4 mr-2" />
            Quyền & Zalo
          </TabsTrigger>
          <TabsTrigger value="advanced" className="h-10 px-4 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Wrench className="h-4 w-4 mr-2" />
            Kỹ thuật
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Bot Settings Card */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cài đặt Bot</h3>
                <p className="text-sm text-muted-foreground">Cấu hình cơ bản của bot</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tên bot</Label>
                  <Input
                    value={localSettings.bot.name}
                    onChange={(e) => updateBotSetting('name', e.target.value)}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tiền tố</Label>
                  <Input
                    value={localSettings.bot.prefix}
                    onChange={(e) => updateBotSetting('prefix', e.target.value)}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-border bg-muted/20 p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Prompt bổ sung từ Web</Label>
                  <Textarea
                    value={localSettings.bot.customSystemPrompt ?? ''}
                    onChange={(e) => updateBotSetting('customSystemPrompt', e.target.value)}
                    placeholder="Soạn thêm prompt riêng của bạn ở đây. Ví dụ: luôn lịch sự với người lạ, ưu tiên trả lời ngắn gọn..."
                    rows={5}
                    className="rounded-xl border-2 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Prompt này được chèn vào system prompt của bot. Không cần sửa `prompts.ts` / `character.ts` nữa.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <SettingToggle
                  label="Yêu cầu tiền tố"
                  description="Bắt buộc dùng tiền tố để gọi bot"
                  checked={localSettings.bot.requirePrefix}
                  onCheckedChange={(v) => updateBotSetting('requirePrefix', v)}
                  icon={MessageSquare}
                  color="#1CB0F6"
                />
                <SettingToggle
                  label="Phát trực tiếp"
                  description="Gửi tin nhắn theo luồng (streaming)"
                  checked={localSettings.bot.useStreaming}
                  onCheckedChange={(v) => updateBotSetting('useStreaming', v)}
                  icon={Zap}
                  color="#FF9600"
                />
                <SettingToggle
                  label="Hiện lệnh gọi công cụ"
                  description="Hiển thị khi bot gọi công cụ"
                  checked={localSettings.bot.showToolCalls}
                  onCheckedChange={(v) => updateBotSetting('showToolCalls', v)}
                  icon={Wrench}
                  color="#CE82FF"
                />
                <SettingToggle
                  label="Ghi nhật ký"
                  description="Ghi nhật ký hoạt động"
                  checked={localSettings.bot.logging}
                  onCheckedChange={(v) => updateBotSetting('logging', v)}
                  icon={Settings}
                  color="#777777"
                />
                <SettingToggle
                  label="Sử dụng nhân vật"
                  description="Sử dụng character/persona cho bot"
                  checked={localSettings.bot.useCharacter}
                  onCheckedChange={(v) => updateBotSetting('useCharacter', v)}
                  icon={Users}
                  color="#1CB0F6"
                />
              </div>
            </div>
          </div>
        </TabsContent>


        {/* Modes Tab */}
        <TabsContent value="modes" className="space-y-6">
          {/* Maintenance Mode Card */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.maintenanceMode?.enabled
              ? 'border-[#FF9600]/50 bg-[#FF9600]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                localSettings.bot.maintenanceMode?.enabled
                  ? 'bg-[#FF9600] text-white shadow-[0_4px_0_0_#E68600]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Chế độ bảo trì</h3>
                <p className="text-sm text-muted-foreground">Khi bật, bot sẽ chỉ phản hồi thông báo bảo trì</p>
              </div>
              <Switch
                checked={localSettings.bot.maintenanceMode?.enabled ?? false}
                onCheckedChange={(v) => updateMaintenanceMode('enabled', v)}
                className="data-[state=checked]:bg-[#FF9600]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Thông báo bảo trì</Label>
              <Textarea
                value={localSettings.bot.maintenanceMode?.message ?? '🔧 Bot đang trong chế độ bảo trì. Vui lòng thử lại sau!'}
                onChange={(e) => updateMaintenanceMode('message', e.target.value)}
                placeholder="Nhập thông báo hiển thị khi bot đang bảo trì..."
                rows={2}
                className="rounded-xl border-2 resize-none"
              />
            </div>
          </div>

          {/* Sleep Mode Card */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.sleepMode?.enabled
              ? 'border-[#CE82FF]/50 bg-[#CE82FF]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                localSettings.bot.sleepMode?.enabled
                  ? 'bg-[#CE82FF] text-white shadow-[0_4px_0_0_#B86EE6]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Moon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Chế độ ngủ</h3>
                <p className="text-sm text-muted-foreground">
                  Tự động offline theo giờ đã cài đặt và tạm ngưng trả lời chat/lệnh
                </p>
              </div>
              <Switch
                checked={localSettings.bot.sleepMode?.enabled ?? false}
                onCheckedChange={(v) => updateSleepMode('enabled', v)}
                className="data-[state=checked]:bg-[#CE82FF]"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Giờ ngủ (0-23)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={localSettings.bot.sleepMode?.sleepHour ?? 23}
                  onChange={(e) => updateSleepMode('sleepHour', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Giờ thức (0-23)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={localSettings.bot.sleepMode?.wakeHour ?? 6}
                  onChange={(e) => updateSleepMode('wakeHour', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
              </div>
            </div>
          </div>

          {/* Private Auto Reply - All DM */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.privateAutoReply?.enabled
              ? 'border-[#1CB0F6]/50 bg-[#1CB0F6]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                localSettings.bot.privateAutoReply?.enabled
                  ? 'bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Auto trả lời mọi tin nhắn riêng</h3>
                <p className="text-sm text-muted-foreground">
                  Khi bật mục này, bot sẽ reply theo mẫu cho toàn bộ tin nhắn riêng từ người quen hoặc người lạ
                </p>
              </div>
              <Switch
                checked={localSettings.bot.privateAutoReply?.enabled ?? false}
                onCheckedChange={(v) => updatePrivateAutoReply('enabled', v)}
                className="data-[state=checked]:bg-[#1CB0F6]"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Mẫu trả lời mọi tin nhắn riêng</Label>
                <Textarea
                  value={localSettings.bot.privateAutoReply?.message ?? ''}
                  onChange={(e) => updatePrivateAutoReply('message', e.target.value)}
                  placeholder="Dạ em đã nhận được tin nhắn riêng rồi, em trả lời theo mẫu này trước nhé..."
                  rows={4}
                  disabled={!(localSettings.bot.privateAutoReply?.enabled ?? false)}
                  className="rounded-xl border-2 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ biến: <code>{'{{senderName}}'}</code>, <code>{'{{ownerName}}'}</code>,{' '}
                  <code>{'{{botName}}'}</code>
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cooldown (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.bot.privateAutoReply?.cooldownMs ?? 600000}
                    onChange={(e) => updatePrivateAutoReply('cooldownMs', Number(e.target.value))}
                    disabled={!(localSettings.bot.privateAutoReply?.enabled ?? false)}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Giới hạn mỗi ngày</Label>
                  <Input
                    type="number"
                    min={1}
                    value={localSettings.bot.privateAutoReply?.dailyLimit ?? 3}
                    onChange={(e) => updatePrivateAutoReply('dailyLimit', Number(e.target.value))}
                    disabled={!(localSettings.bot.privateAutoReply?.enabled ?? false)}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Direct Message Auto Reply - Friend */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.friendDmReplyEnabled
              ? 'border-[#CE82FF]/50 bg-[#CE82FF]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                localSettings.bot.friendDmReplyEnabled
                  ? 'bg-[#CE82FF] text-white shadow-[0_3px_0_0_#B86EE6]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Auto trả lời tin nhắn riêng người quen</h3>
                <p className="text-sm text-muted-foreground">
                  Chỉ áp dụng cho người đã kết bạn và chỉ chạy khi mục "mọi tin nhắn riêng" đang tắt
                </p>
              </div>
              <Switch
                checked={localSettings.bot.friendDmReplyEnabled ?? true}
                onCheckedChange={updateFriendDmReplyEnabled}
                className="data-[state=checked]:bg-[#CE82FF]"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Mục này chỉ quyết định người quen nhắn riêng có được bot trả lời theo luồng AI bình thường hay không.
              Không dùng mẫu auto-reply riêng.
            </p>
          </div>

          {/* Stranger Auto Reply */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.strangerAutoReply?.enabled
              ? 'border-[#58CC02]/50 bg-[#58CC02]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                localSettings.bot.strangerAutoReply?.enabled
                  ? 'bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Auto trả lời người lạ</h3>
                <p className="text-sm text-muted-foreground">
                  Chỉ áp dụng cho người chưa kết bạn và chỉ chạy khi mục "mọi tin nhắn riêng" đang tắt
                </p>
              </div>
              <Switch
                checked={localSettings.bot.strangerAutoReply?.enabled ?? false}
                onCheckedChange={(v) => updateStrangerAutoReply('enabled', v)}
                className="data-[state=checked]:bg-[#58CC02]"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Mẫu trả lời người lạ</Label>
                <Textarea
                  value={localSettings.bot.strangerAutoReply?.message ?? ''}
                  onChange={(e) => updateStrangerAutoReply('message', e.target.value)}
                  placeholder="Em là bot tự động của anh Hùng, anh/chị chờ một chút giúp em nhé..."
                  rows={4}
                  disabled={!(localSettings.bot.strangerAutoReply?.enabled ?? false)}
                  className="rounded-xl border-2 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ biến: <code>{'{{senderName}}'}</code>, <code>{'{{ownerName}}'}</code>,{' '}
                  <code>{'{{botName}}'}</code>
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cooldown (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.bot.strangerAutoReply?.cooldownMs ?? 600000}
                    onChange={(e) => updateStrangerAutoReply('cooldownMs', Number(e.target.value))}
                    disabled={!(localSettings.bot.strangerAutoReply?.enabled ?? false)}
                    className="h-11 rounded-xl border-2"
                  />
                  <p className="text-xs text-muted-foreground">Mặc định 600000ms (10 phút)</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Giới hạn mỗi ngày</Label>
                  <Input
                    type="number"
                    min={1}
                    value={localSettings.bot.strangerAutoReply?.dailyLimit ?? 1}
                    onChange={(e) => updateStrangerAutoReply('dailyLimit', Number(e.target.value))}
                    disabled={!(localSettings.bot.strangerAutoReply?.enabled ?? false)}
                    className="h-11 rounded-xl border-2"
                  />
                  <p className="text-xs text-muted-foreground">Mặc định 1 lần/người/ngày</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Debug */}
          <div className={`rounded-2xl border-2 p-6 transition-colors ${
            localSettings.bot.cloudDebug?.enabled
              ? 'border-[#1CB0F6]/50 bg-[#1CB0F6]/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                localSettings.bot.cloudDebug?.enabled
                  ? 'bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Cloud className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Cloud Debug (Self Chat)</h3>
                <p className="text-sm text-muted-foreground">Dùng khi nhắn từ chính account bot, tránh self-loop</p>
              </div>
              <Switch
                checked={localSettings.bot.cloudDebug?.enabled ?? false}
                onCheckedChange={(v) => updateCloudDebug('enabled', v)}
                className="data-[state=checked]:bg-[#1CB0F6]"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Cloud Debug Prefix</Label>
                <Input
                  value={localSettings.bot.cloudDebug?.prefix ?? '#bot'}
                  onChange={(e) => updateCloudDebug('prefix', e.target.value)}
                  placeholder="#bot"
                  disabled={
                    !(localSettings.bot.cloudDebug?.enabled ?? false) ||
                    (localSettings.bot.cloudDebug?.matchAnyHash ?? false)
                  }
                  className="h-11 rounded-xl border-2 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ví dụ: #bot, #em, #bé. Nếu nhập &quot;bé&quot;, bot vẫn hiểu là &quot;#bé&quot;.
                </p>
              </div>
              <SettingToggle
                label="Chế độ mọi dấu #"
                description='Bật để chỉ cần tin nhắn có ký tự "#" là bot tự phản hồi (self chat)'
                checked={localSettings.bot.cloudDebug?.matchAnyHash ?? false}
                onCheckedChange={(v) => updateCloudDebug('matchAnyHash', v)}
                icon={MessageSquare}
                color="#1CB0F6"
              />
            </div>
          </div>
        </TabsContent>


        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          {/* Gemini Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Gemini AI</h3>
                <p className="text-sm text-muted-foreground">Cấu hình model Gemini</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm font-semibold">Temperature: {localSettings.gemini?.temperature ?? 1}</Label>
                  </div>
                  <Slider
                    value={[localSettings.gemini?.temperature ?? 1]}
                    onValueChange={([v]) => updateGemini('temperature', v)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Độ sáng tạo của AI (0 = chính xác, 2 = sáng tạo)</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm font-semibold">Top P: {localSettings.gemini?.topP ?? 0.95}</Label>
                  </div>
                  <Slider
                    value={[localSettings.gemini?.topP ?? 0.95]}
                    onValueChange={([v]) => updateGemini('topP', v)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Nucleus sampling (0.1 = tập trung, 1 = đa dạng)</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Max Output Tokens</Label>
                  <Input
                    type="number"
                    value={localSettings.gemini?.maxOutputTokens ?? 65536}
                    onChange={(e) => updateGemini('maxOutputTokens', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Thinking Budget</Label>
                  <Input
                    type="number"
                    value={localSettings.gemini?.thinkingBudget ?? 8192}
                    onChange={(e) => updateGemini('thinkingBudget', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Models (mỗi dòng 1 model)</Label>
                <Textarea
                  value={(localSettings.gemini?.models ?? []).join('\n')}
                  onChange={(e) => updateGemini('models', e.target.value.split('\n').filter(Boolean))}
                  placeholder="models/gemini-3-flash-preview"
                  rows={3}
                  className="rounded-xl border-2 resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Groq Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF9600] text-white shadow-[0_3px_0_0_#E68600]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Groq (Background Agent)</h3>
                <p className="text-sm text-muted-foreground">Cấu hình model Groq cho background tasks</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Primary Model</Label>
                  <Input
                    value={localSettings.groqModels?.primary ?? ''}
                    onChange={(e) => updateGroqModels('primary', e.target.value)}
                    className="h-11 rounded-xl border-2 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Fallback Model</Label>
                  <Input
                    value={localSettings.groqModels?.fallback ?? ''}
                    onChange={(e) => updateGroqModels('fallback', e.target.value)}
                    className="h-11 rounded-xl border-2 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm font-semibold">Temperature: {localSettings.groqModels?.temperature ?? 0.7}</Label>
                  </div>
                  <Slider
                    value={[localSettings.groqModels?.temperature ?? 0.7]}
                    onValueChange={([v]) => updateGroqModels('temperature', v)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm font-semibold">Top P: {localSettings.groqModels?.topP ?? 0.95}</Label>
                  </div>
                  <Slider
                    value={[localSettings.groqModels?.topP ?? 0.95]}
                    onValueChange={([v]) => updateGroqModels('topP', v)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Primary Max Tokens</Label>
                  <Input
                    type="number"
                    value={localSettings.groqModels?.primaryMaxTokens ?? 65536}
                    onChange={(e) => updateGroqModels('primaryMaxTokens', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Fallback Max Tokens</Label>
                  <Input
                    type="number"
                    value={localSettings.groqModels?.fallbackMaxTokens ?? 16384}
                    onChange={(e) => updateGroqModels('fallbackMaxTokens', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background Agent Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#CE82FF] text-white shadow-[0_3px_0_0_#B86EE6]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Background Agent</h3>
                <p className="text-sm text-muted-foreground">Cấu hình agent chạy nền</p>
              </div>
            </div>

            <div className="space-y-6">
              <SettingToggle
                label="Bật Groq"
                description="Sử dụng Groq cho background agent"
                checked={localSettings.backgroundAgent?.groqEnabled ?? true}
                onCheckedChange={(v) => updateBackgroundAgent('groqEnabled', v)}
                icon={Zap}
                color="#FF9600"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Poll Interval (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.backgroundAgent?.pollIntervalMs ?? 90000}
                    onChange={(e) => updateBackgroundAgent('pollIntervalMs', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Max Tool Iterations</Label>
                  <Input
                    type="number"
                    value={localSettings.backgroundAgent?.maxToolIterations ?? 5}
                    onChange={(e) => updateBackgroundAgent('maxToolIterations', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Group Batch Size</Label>
                  <Input
                    type="number"
                    value={localSettings.backgroundAgent?.groupBatchSize ?? 10}
                    onChange={(e) => updateBackgroundAgent('groupBatchSize', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>


        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#CE82FF] text-white shadow-[0_3px_0_0_#B86EE6]">
                <Puzzle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Mô-đun</h3>
                <p className="text-sm text-muted-foreground">Bật/tắt các mô-đun của bot</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(localSettings.modules).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border-2 border-transparent hover:border-[#CE82FF]/30 transition-colors"
                >
                  <div>
                    <span className="font-semibold capitalize">{key}</span>
                    <p className="text-xs text-muted-foreground">{getModuleDescription(key)}</p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(v) => updateModule(key, v)}
                    className="data-[state=checked]:bg-[#CE82FF]"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Buffer Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Buffer & Timing</h3>
                <p className="text-sm text-muted-foreground">Cấu hình độ trễ và buffer</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Buffer Delay (ms)</Label>
                <Input
                  type="number"
                  min={100}
                  value={localSettings.buffer?.delayMs ?? 2500}
                  onChange={(e) => updateBuffer('delayMs', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Độ trễ trước khi xử lý tin nhắn · Tối thiểu 100ms</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Typing Refresh (ms)</Label>
                <Input
                  type="number"
                  min={100}
                  value={localSettings.buffer?.typingRefreshMs ?? 3000}
                  onChange={(e) => updateBuffer('typingRefreshMs', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Tần suất refresh trạng thái đang gõ · Tối thiểu 100ms</p>
              </div>
            </div>
          </div>

          {/* History Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">History & Context</h3>
                <p className="text-sm text-muted-foreground">Cấu hình lịch sử và context</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max Context Tokens</Label>
                <Input
                  type="number"
                  min={10000}
                  value={localSettings.history?.maxContextTokens ?? 300000}
                  onChange={(e) => updateHistory('maxContextTokens', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Tối thiểu 10,000</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max Token History</Label>
                <Input
                  type="number"
                  min={1000}
                  value={localSettings.bot.maxTokenHistory}
                  onChange={(e) => updateBotSetting('maxTokenHistory', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Tối thiểu 1,000</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max Input Tokens</Label>
                <Input
                  type="number"
                  min={10000}
                  value={localSettings.bot.maxInputTokens}
                  onChange={(e) => updateBotSetting('maxInputTokens', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Tối thiểu 10,000</p>
              </div>
            </div>
          </div>

          {/* Memory Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF9600] text-white shadow-[0_3px_0_0_#E68600]">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Memory</h3>
                <p className="text-sm text-muted-foreground">Cấu hình bộ nhớ chung (shared memory)</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Decay Half-Life (days)</Label>
                <Input
                  type="number"
                  value={localSettings.memory?.decayHalfLifeDays ?? 30}
                  onChange={(e) => updateMemory('decayHalfLifeDays', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Thời gian giảm một nửa độ quan trọng</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Access Boost Factor</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={localSettings.memory?.accessBoostFactor ?? 0.2}
                  onChange={(e) => updateMemory('accessBoostFactor', Number(e.target.value))}
                  className="h-11 rounded-xl border-2"
                />
                <p className="text-xs text-muted-foreground">Hệ số tăng khi truy cập</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Embedding Model</Label>
                <Input
                  value={localSettings.memory?.embeddingModel ?? 'gemini-embedding-001'}
                  onChange={(e) => updateMemory('embeddingModel', e.target.value)}
                  className="h-11 rounded-xl border-2 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cloud Backup Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#CE82FF] text-white shadow-[0_3px_0_0_#B86EE6]">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cloud Backup</h3>
                <p className="text-sm text-muted-foreground">Cấu hình sao lưu đám mây</p>
              </div>
            </div>

            <div className="space-y-6">
              <SettingToggle
                label="Bật Cloud Backup"
                description="Tự động sao lưu lên cloud"
                checked={localSettings.cloudBackup?.enabled ?? true}
                onCheckedChange={(v) => updateCloudBackup('enabled', v)}
                icon={Cloud}
                color="#CE82FF"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Throttle (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.cloudBackup?.throttleMs ?? 10000}
                    onChange={(e) => updateCloudBackup('throttleMs', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Restore Delay (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.cloudBackup?.restoreDelayMs ?? 15000}
                    onChange={(e) => updateCloudBackup('restoreDelayMs', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Initial Backup Delay (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.cloudBackup?.initialBackupDelayMs ?? 30000}
                    onChange={(e) => updateCloudBackup('initialBackupDelayMs', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>


        {/* Access Tab */}
        <TabsContent value="access" className="space-y-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Phân quyền lệnh</h3>
                <p className="text-sm text-muted-foreground">Admin toàn quyền, user thường chỉ dùng lệnh được cấp</p>
              </div>
            </div>

            <div className="space-y-6">
              <SettingToggle
                label="Bật hệ thống lệnh"
                description="Tắt để chặn toàn bộ lệnh với user thường (admin vẫn dùng được)"
                checked={commandAccess.commandsEnabled}
                onCheckedChange={(v) => updateCommandAccess('commandsEnabled', v)}
                icon={Wrench}
                color="#1CB0F6"
              />
              <SettingToggle
                label="Ràng buộc lệnh theo whitelist chat"
                description="Bật: lệnh cũng phải qua Allowed User/Group IDs. Tắt: lệnh dùng quyền riêng ở khối này."
                checked={commandAccess.respectGlobalAccessLists}
                onCheckedChange={(v) => updateCommandAccess('respectGlobalAccessLists', v)}
                icon={Shield}
                color="#FF9600"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Admin chính (Owner)</Label>
                  <Input
                    value={localSettings.adminUserId}
                    onChange={(e) => setLocalSettings({ ...localSettings, adminUserId: e.target.value })}
                    className="h-11 rounded-xl border-2 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">Admin phụ (mỗi dòng 1 ID)</Label>
                  <Textarea
                    value={(commandAccess.additionalAdminUserIds ?? []).join('\n')}
                    onChange={(e) =>
                      updateCommandAccess(
                        'additionalAdminUserIds',
                        e.target.value.split('\n').map((id) => id.trim()).filter(Boolean),
                      )
                    }
                    placeholder="Nhập các user ID có quyền admin bổ sung..."
                    rows={2}
                    className="rounded-xl border-2 resize-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Lệnh user thường được phép dùng (mỗi dòng 1 lệnh)</Label>
                <Textarea
                  value={(commandAccess.nonAdminAllowedCommands ?? []).join('\n')}
                  onChange={(e) =>
                    updateCommandAccess(
                      'nonAdminAllowedCommands',
                      e.target.value.split('\n').map((id) => id.trim()).filter(Boolean),
                    )
                  }
                  placeholder={`Ví dụ:\nhelp\ncommand\ngame\ndaily\nsodu\nluatchoitaixiu`}
                  rows={5}
                  className="rounded-xl border-2 resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống = user thường dùng toàn bộ lệnh. Khuyên dùng tên lệnh chuẩn (không cần dấu !).
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Thông báo khi bị từ chối quyền</Label>
                <Textarea
                  value={commandAccess.denyMessage}
                  onChange={(e) => updateCommandAccess('denyMessage', e.target.value)}
                  rows={2}
                  className="rounded-xl border-2 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Allowed User IDs */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#58CC02] text-white shadow-[0_3px_0_0_#46A302]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Allowed User IDs</h3>
                <p className="text-sm text-muted-foreground">
                  Whitelist cho chat AI thông thường (để trống = tất cả). Quyền lệnh ! cấu hình riêng ở mục Phân quyền lệnh.
                </p>
              </div>
            </div>

	              <div className="space-y-2">
	                <Label className="text-sm font-semibold">User IDs (mỗi dòng 1 ID)</Label>
              <Textarea
                value={(localSettings.allowedUserIds ?? []).join('\n')}
                onChange={(e) => updateAllowedUserIds(e.target.value)}
                placeholder="Để trống để cho phép tất cả user chat AI..."
                rows={4}
	                className="rounded-xl border-2 resize-none font-mono text-sm"
	              />
	            </div>
	          </div>

	          {/* Friends IDs Helper */}
	          <div className="rounded-2xl border-2 border-border bg-card p-6">
	            <div className="flex items-center justify-between gap-3 mb-4">
	              <div className="flex items-center gap-3">
	                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6] text-white shadow-[0_3px_0_0_#1899D6]">
	                  <Users className="h-5 w-5" />
	                </div>
	                <div>
	                  <h3 className="text-lg font-bold">Danh sách bạn bè & ID</h3>
	                  <p className="text-sm text-muted-foreground">
	                    Lấy nhanh ID của bạn bè đã kết bạn với bot để dán vào Memory/Settings
	                  </p>
	                </div>
	              </div>
	              <Button
	                variant="outline"
	                onClick={() => refreshContactsMutation.mutate()}
	                disabled={refreshContactsMutation.isPending}
	                className="rounded-xl border-2"
	              >
	                <RefreshCw
	                  className={`h-4 w-4 mr-2 ${refreshContactsMutation.isPending ? 'animate-spin' : ''}`}
	                />
	                Làm mới
	              </Button>
	            </div>

	            <div className="flex flex-wrap items-center gap-2 mb-3">
	              <div className="relative min-w-[280px] flex-1">
	                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
	                <Input
	                  value={contactSearch}
	                  onChange={(e) => setContactSearch(e.target.value)}
	                  placeholder="Tìm theo tên hoặc ID (vd: Meow...)"
	                  className="h-10 rounded-xl border-2 pl-9"
	                />
	              </div>
	              <Button
	                variant="outline"
	                onClick={() => copyToClipboard(filteredContacts.map((c) => c.userId).join('\n'), 'Đã copy danh sách ID')}
	                disabled={filteredContacts.length === 0}
	                className="rounded-xl border-2"
	              >
	                <Copy className="h-4 w-4 mr-2" />
	                Copy IDs
	              </Button>
	              <Button
	                variant="outline"
	                onClick={() => exportContactIds(filteredContacts)}
	                disabled={filteredContacts.length === 0}
	                className="rounded-xl border-2"
	              >
	                <Download className="h-4 w-4 mr-2" />
	                Xuất TXT
	              </Button>
	            </div>

	            <p className="text-xs text-muted-foreground mb-3">
	              Hiển thị {filteredContacts.length}/{contacts.length} bạn bè
	            </p>

	            <div className="max-h-80 overflow-auto rounded-xl border-2 border-border">
	              {contactsLoading ? (
	                <div className="p-4 text-sm text-muted-foreground">Đang tải danh sách bạn bè...</div>
	              ) : filteredContacts.length === 0 ? (
	                <div className="p-4 text-sm text-muted-foreground">Không tìm thấy bạn bè phù hợp.</div>
	              ) : (
	                <div className="divide-y divide-border">
	                  {filteredContacts.map((c) => (
	                    <div key={c.userId} className="flex items-center justify-between gap-3 p-3">
	                      <div className="min-w-0">
	                        <p className="font-semibold truncate">{c.displayName}</p>
	                        <p className="text-xs text-muted-foreground font-mono truncate">{c.userId}</p>
	                      </div>
	                      <div className="flex items-center gap-2">
	                        <Button
	                          size="sm"
	                          variant="outline"
	                          className="rounded-lg border-2"
	                          onClick={() => copyToClipboard(c.userId, `Đã copy ID: ${c.displayName}`)}
	                        >
	                          <Copy className="h-3.5 w-3.5 mr-1" />
	                          Copy
	                        </Button>
	                        <Button
	                          size="sm"
	                          variant="outline"
	                          className="rounded-lg border-2"
	                          onClick={() => addAllowedUserId(c.userId)}
	                        >
	                          <UserPlus className="h-3.5 w-3.5 mr-1" />
	                          Thêm
	                        </Button>
	                      </div>
	                    </div>
	                  ))}
	                </div>
	              )}
	            </div>
	          </div>

	          {/* Allowed Group IDs */}
	          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1CB0F6]/10">
                <MessageSquare className="h-5 w-5 text-[#1CB0F6]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Nhóm được phép</h3>
                <p className="text-sm text-muted-foreground">
                  {(localSettings.allowAllGroups ?? true)
                    ? '💬 Cho phép chat AI ở tất cả nhóm'
                    : `✅ Whitelist chat AI: ${(localSettings.allowedGroupIds ?? []).length} nhóm`}
                </p>
              </div>
            </div>
            <GroupPicker
              allowAll={localSettings.allowAllGroups ?? true}
              selectedIds={localSettings.allowedGroupIds ?? []}
              onChange={updateAllowedGroups}
            />
            <p className="text-xs text-muted-foreground mt-3">
              Nút gạt/tích chọn trong danh sách nhóm sẽ tự lưu ngay.
            </p>
          </div>
        </TabsContent>

        {/* Advanced / Technical Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Core Technical Settings */}
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF4B4B] text-white shadow-[0_3px_0_0_#E63E3E]">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Thiết lập kỹ thuật</h3>
                <p className="text-sm text-muted-foreground">Cấu hình nâng cao — thay đổi cẩn thận</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Độ sâu công cụ tối đa</Label>
                  <Input
                    type="number"
                    value={localSettings.bot.maxToolDepth}
                    onChange={(e) => updateBotSetting('maxToolDepth', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                  <p className="text-xs text-muted-foreground">Số lần bot có thể gọi tool lồng nhau</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Giới hạn tốc độ (ms)</Label>
                  <Input
                    type="number"
                    value={localSettings.bot.rateLimitMs}
                    onChange={(e) => updateBotSetting('rateLimitMs', Number(e.target.value))}
                    className="h-11 rounded-xl border-2"
                  />
                  <p className="text-xs text-muted-foreground">Cooldown giữa các lần xử lý lệnh</p>
                </div>
              </div>

              <div className="space-y-4">
                <SettingToggle
                  label="Cho phép NSFW"
                  description="Cho phép nội dung người lớn"
                  checked={localSettings.bot.allowNSFW}
                  onCheckedChange={(v) => updateBotSetting('allowNSFW', v)}
                  icon={Shield}
                  color="#FF4B4B"
                />
                <SettingToggle
                  label="Tự nghe"
                  description="Bot nghe tin nhắn của chính mình (self-listen)"
                  checked={localSettings.bot.selfListen}
                  onCheckedChange={(v) => updateBotSetting('selfListen', v)}
                  icon={MessageSquare}
                  color="#1CB0F6"
                />
                <SettingToggle
                  label="Ghi log ra file"
                  description="Ghi nhật ký ra file thay vì chỉ console"
                  checked={localSettings.bot.fileLogging}
                  onCheckedChange={(v) => updateBotSetting('fileLogging', v)}
                  icon={Database}
                  color="#777777"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Setting Toggle Component
function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
  color,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border-2 border-transparent hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        style={{ backgroundColor: checked ? color : undefined }}
      />
    </div>
  );
}

// Module descriptions
function getModuleDescription(key: string): string {
  const descriptions: Record<string, string> = {
    system: 'Các lệnh hệ thống cơ bản',
    chat: 'Trò chuyện và hội thoại',
    media: 'Xử lý hình ảnh, video, audio',
    search: 'Tìm kiếm trên internet',
    social: 'Tương tác mạng xã hội',
    task: 'Quản lý công việc và nhắc nhở',
    academic: 'Hỗ trợ học tập',
    entertainment: 'Giải trí và trò chơi',
  };
  return descriptions[key] ?? '';
}
