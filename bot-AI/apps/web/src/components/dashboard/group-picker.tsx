'use client';

/**
 * GroupPicker - Hiển thị danh sách nhóm Zalo và cho phép chọn nhóm nào được bot reply
 *
 * Semantics:
 *   allowAll = true         → Cho phép TẤT CẢ nhóm
 *   allowAll = false        → Chỉ cho phép các nhóm trong selectedIds (có thể rỗng = chặn tất cả)
 *
 * Internal state tách biệt với prop → tránh bị reset khi parent re-render
 * Tự lưu whitelist khi có thay đổi toggle/tích chọn
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { groupsApiClient, type ZaloGroup } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Search, Users, WifiOff, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

interface GroupPickerProps {
  /** Bật/tắt chế độ cho phép tất cả nhóm */
  allowAll: boolean;
  /** Các group ID đang được phép khi allowAll = false */
  selectedIds: string[];
  /** Gọi khi có thay đổi cấu hình nhóm; return false nếu save thất bại */
  onChange: (value: { allowAll: boolean; ids: string[] }) => void | boolean | Promise<void | boolean>;
}

function GroupAvatar({ group }: { group: ZaloGroup }) {
  const [imgError, setImgError] = useState(false);
  const initials = (group.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (group.avatar && !imgError) {
    return (
      <img
        src={group.avatar}
        alt={group.name}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
      />
    );
  }

  // Fallback to color initials
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ];
  const colorIdx =
    group.id
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${colors[colorIdx]}`}
    >
      {initials}
    </div>
  );
}

const serializeState = (allowAll: boolean, ids: string[]) =>
  JSON.stringify({ allowAll, ids: [...ids].sort() });

export function GroupPicker({ allowAll: allowAllProp, selectedIds, onChange }: GroupPickerProps) {
  const [groups, setGroups] = useState<ZaloGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [autoReplySavingId, setAutoReplySavingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Internal selection state — độc lập với prop, chỉ sync lần đầu hoặc sau khi save
  // allowAll là state riêng để hỗ trợ trường hợp 0 nhóm hợp lệ (chặn toàn bộ)
  const [allowAll, setAllowAll] = useState<boolean>(allowAllProp);
  const [internalIds, setInternalIds] = useState<string[]>(selectedIds);
  const [isDirty, setIsDirty] = useState(false);
  const initializedRef = useRef(false);
  const prevSavedRef = useRef<string>(serializeState(allowAllProp, selectedIds));
  const saveTimeoutRef = useRef<number | null>(null);

  // Sync prop → internal CHỈ khi chưa init hoặc khi prop đổi từ bên ngoài (sau khi save)
  useEffect(() => {
    const serialized = serializeState(allowAllProp, selectedIds);
    if (!initializedRef.current || (!isDirty && serialized !== prevSavedRef.current)) {
      setAllowAll(allowAllProp);
      setInternalIds(selectedIds);
      prevSavedRef.current = serialized;
      initializedRef.current = true;
      setIsDirty(false);
    }
  }, [allowAllProp, selectedIds, isDirty]);

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      try {
        await groupsApiClient.refresh();
      } catch {
        // ignore
      }
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await groupsApiClient.getAll();
      if (res.data?.success && res.data.data) {
        setGroups(res.data.data);
      } else {
        setError(res.data?.error ?? 'Không lấy được danh sách nhóm');
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'Lỗi kết nối';
      if (msg.includes('503') || msg.includes('502') || msg.includes('offline')) {
        setError('bot-offline');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.id.includes(search),
      ),
    [groups, search],
  );

  const updateInternal = (ids: string[]) => {
    setInternalIds(ids);
    setIsDirty(serializeState(allowAll, ids) !== prevSavedRef.current);
  };

  const toggleGroup = (groupId: string) => {
    const isSelected = internalIds.includes(groupId);
    if (isSelected) {
      updateInternal(internalIds.filter((id) => id !== groupId));
    } else {
      updateInternal([...internalIds, groupId]);
    }
  };

  const handleAllowAllToggle = (checked: boolean) => {
    setAllowAll(checked);
    setIsDirty(serializeState(checked, internalIds) !== prevSavedRef.current);
  };

  const selectAll = () => {
    // Chọn tất cả filtered groups, giữ các nhóm ngoài filter
    const filteredIds = new Set(filteredGroups.map((g) => g.id));
    const outsideFilter = internalIds.filter((id) => !filteredIds.has(id));
    updateInternal([...outsideFilter, ...filteredGroups.map((g) => g.id)]);
  };

  const deselectAll = () => {
    // Bỏ chọn tất cả filtered groups, giữ các nhóm ngoài filter
    const filteredIds = new Set(filteredGroups.map((g) => g.id));
    updateInternal(internalIds.filter((id) => !filteredIds.has(id)));
  };

  const checkedInFiltered = filteredGroups.filter((g) => internalIds.includes(g.id)).length;
  const autoReplyCount = groups.filter((g) => g.isAutoReply).length;

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        const result = await onChange({ allowAll, ids: internalIds });
        if (result === false) return;
        prevSavedRef.current = serializeState(allowAll, internalIds);
        setIsDirty(false);
      } catch (e: unknown) {
        const msg = (e as Error)?.message || 'Không lưu được danh sách nhóm';
        toast.error('Tự lưu nhóm thất bại', { description: msg });
      } finally {
        setSaving(false);
      }
    }, 350);
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [allowAll, internalIds, isDirty, onChange]);

  const toggleAutoReply = async (groupId: string, enabled: boolean) => {
    setAutoReplySavingId(groupId);
    try {
      const res = await groupsApiClient.setAutoReply(groupId, enabled);
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Không cập nhật được auto-reply');
      }
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, isAutoReply: enabled } : g)),
      );
      toast.success(enabled ? 'Đã bật auto-reply' : 'Đã tắt auto-reply');
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Lỗi kết nối';
      toast.error('Lỗi cập nhật auto-reply', { description: msg });
    } finally {
      setAutoReplySavingId(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Bot offline or fetch error
  if (error === 'bot-offline' || (error && groups.length === 0)) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
        <WifiOff className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {error === 'bot-offline'
            ? 'Bot đang offline — không thể lấy danh sách nhóm.'
            : `Lỗi: ${error}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {allowAll ? (
            <>
              Đang cho phép: <span className="font-semibold">tất cả nhóm</span>
            </>
          ) : (
            <>
              Số nhóm được phép: <span className="font-semibold">{internalIds.length}</span>
            </>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchGroups()}
          className="rounded-xl mt-1"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Allow All Toggle */}
      <div className="flex items-center justify-between rounded-xl border-2 border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Cho phép tất cả nhóm</p>
          <p className="text-xs text-muted-foreground">
            {allowAll
              ? 'Bot sẽ reply ở mọi nhóm (nếu được mention hoặc nhóm đang auto-reply)'
              : internalIds.length === 0
                ? 'Không nhóm nào được phép'
                : `Chỉ ${internalIds.length}/${groups.length} nhóm được phép`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-reply đang bật ở {autoReplyCount}/{groups.length} nhóm
          </p>
        </div>
        <Switch checked={allowAll} onCheckedChange={handleAllowAllToggle} />
      </div>

      <div className="space-y-3">
        {/* Search + bulk actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhóm..."
              className="pl-9 rounded-xl border-2"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchGroups(true)}
            disabled={refreshing}
            className="rounded-xl border-2 shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={allowAll}
            className="rounded-lg text-xs h-7 gap-1"
          >
            <CheckSquare className="w-3 h-3" />
            Chọn tất cả
            {search && <span className="text-muted-foreground">({filteredGroups.length})</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={allowAll}
            className="rounded-lg text-xs h-7 gap-1"
          >
            <Square className="w-3 h-3" />
            Bỏ chọn tất cả
            {search && <span className="text-muted-foreground">({checkedInFiltered})</span>}
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {allowAll ? `Tất cả (${groups.length})` : `${internalIds.length}/${groups.length} nhóm`}
          </Badge>
        </div>

        {/* Group list */}
        <ScrollArea className="h-72 rounded-xl border-2 border-border">
          <div className="p-2 space-y-1">
            {filteredGroups.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {groups.length === 0
                  ? 'Không tìm thấy nhóm nào.'
                  : 'Không có kết quả cho tìm kiếm này.'}
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isChecked = internalIds.includes(group.id);
                const isHighlighted = !allowAll && isChecked;
                return (
                  <div
                    key={group.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!allowAll) toggleGroup(group.id);
                    }}
                    onKeyDown={(e) => {
                      if (!allowAll && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        toggleGroup(group.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
                      isHighlighted
                        ? 'bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/40'
                        : 'hover:bg-muted/50 border-2 border-transparent'
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isHighlighted
                          ? 'bg-[#1CB0F6] border-[#1CB0F6]'
                          : 'border-border bg-card'
                      }`}
                    >
                      {isHighlighted && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Avatar */}
                    <GroupAvatar group={group} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.memberCount} thành viên
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.isAutoReply && (
                        <Badge className="bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30">
                          auto
                        </Badge>
                      )}
                      <Switch
                        checked={group.isAutoReply}
                        disabled={autoReplySavingId === group.id}
                        onCheckedChange={(checked) => toggleAutoReply(group.id, checked)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

      </div>

      {/* Auto-save status */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        {saving ? (
          <p className="text-xs text-[#1CB0F6] font-medium">● Đang tự lưu...</p>
        ) : isDirty ? (
          <p className="text-xs text-amber-500 font-medium">● Có thay đổi chưa lưu</p>
        ) : (
          <p className="text-xs text-muted-foreground">Đã tự lưu thay đổi nhóm</p>
        )}
        <p className="text-xs text-muted-foreground">Tích chọn/gạt là lưu ngay</p>
      </div>
    </div>
  );
}
