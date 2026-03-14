'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { envApiClient, envDirectClient, type EnvGroup, type EnvKeyItem, type GeminiKeyStatus, type ApiKeyHealthItem, type ApiKeyStatus } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Search,
  Cloud,
  Settings2,
  Cpu,
  Trash2,
  Plus,
  AlertTriangle,
  ArrowRight,
  Clock,
  ScanLine,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Minus,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Gợi ý cho từng key: mô tả + link lấy key
const KEY_HINTS: Record<string, { desc: string; url?: string }> = {
  // Gemini (prefix match)
  GEMINI_API_KEY: {
    desc: 'API key cho Google Gemini — AI chat chính của bot. Miễn phí, hỗ trợ nhiều key để tránh rate limit.',
    url: 'https://aistudio.google.com/app/apikey',
  },
  GROQ_API_KEY: {
    desc: 'API key Groq — chạy Llama/Mixtral tốc độ cực cao, miễn phí.',
    url: 'https://console.groq.com/keys',
  },
  ELEVENLABS_API_KEY: {
    desc: 'API key ElevenLabs — tạo giọng nói AI (Text-to-Speech). Gói miễn phí 10k ký tự/tháng.',
    url: 'https://elevenlabs.io/app/settings/api-keys',
  },
  FREEPIK_API_KEY: {
    desc: 'API key Freepik — tạo ảnh AI. Đăng ký để nhận key miễn phí có giới hạn.',
    url: 'https://www.freepik.com/api/',
  },
  E2B_API_KEY: {
    desc: 'API key E2B — chạy code Python/JS trong sandbox an toàn (tính năng thực thi code).',
    url: 'https://e2b.dev/dashboard',
  },
  GOOGLE_SEARCH_API_KEY: {
    desc: 'Google Custom Search JSON API — dùng để tìm kiếm web. Tạo ở Google Cloud Console, bật API "Custom Search JSON API".',
    url: 'https://console.cloud.google.com/apis/credentials',
  },
  GOOGLE_SEARCH_CX: {
    desc: 'Search Engine ID (CX) — ID của Programmable Search Engine. Tạo xong copy CX từ trang quản lý.',
    url: 'https://programmablesearchengine.google.com/controlpanel/all',
  },
  YOUTUBE_API_KEY: {
    desc: 'YouTube Data API v3 — tìm kiếm video YouTube. Bật API trong Google Cloud Console.',
    url: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  },
  GIPHY_API_KEY: {
    desc: 'API key Giphy — tìm kiếm và gửi GIF. Tạo app miễn phí trên Giphy Developers.',
    url: 'https://developers.giphy.com/dashboard/',
  },
  GITHUB_GIST_TOKEN: {
    desc: 'GitHub Personal Access Token (scope: gist) — dùng để tự động backup dữ liệu lên Gist.',
    url: 'https://github.com/settings/tokens',
  },
  GITHUB_GIST_ID: {
    desc: 'ID của GitHub Gist lưu backup. Tạo 1 gist trên GitHub rồi copy ID từ URL (phần sau gist.github.com/username/).',
    url: 'https://gist.github.com/',
  },
  API_KEY: {
    desc: 'Mật khẩu bảo vệ Web Dashboard. Đặt chuỗi ngẫu nhiên an toàn, không để trống.',
  },
  LOG_RECEIVER_ID: {
    desc: 'ID Zalo của người nhận thông báo lỗi hệ thống. Để trống nếu không cần nhận log.',
  },
};

function getKeyHint(keyName: string) {
  // Exact match trước
  if (KEY_HINTS[keyName]) return KEY_HINTS[keyName];
  // Prefix match cho GEMINI_API_KEY_1..10
  const prefix = Object.keys(KEY_HINTS).find((k) => keyName.startsWith(k + '_') || keyName === k);
  return prefix ? KEY_HINTS[prefix] : undefined;
}

const GROUP_ICONS: Record<string, React.ElementType> = {
  'Gemini API Keys': Zap,
  'AI & Services': Cpu,
  'Search & Media': Search,
  'Cloud & Backup': Cloud,
  System: Settings2,
};

const GROUP_COLORS: Record<string, string> = {
  'Gemini API Keys': 'text-[#1CB0F6]',
  'AI & Services': 'text-[#CE82FF]',
  'Search & Media': 'text-[#FF9600]',
  'Cloud & Backup': 'text-[#58CC02]',
  System: 'text-[#777777]',
};

const GROUP_BG: Record<string, string> = {
  'Gemini API Keys': 'bg-[#1CB0F6]/10',
  'AI & Services': 'bg-[#CE82FF]/10',
  'Search & Media': 'bg-[#FF9600]/10',
  'Cloud & Backup': 'bg-[#58CC02]/10',
  System: 'bg-[#777777]/10',
};

// ── Confirm delete dialog ─────────────────────────────────────────────────

function ConfirmDeleteDialog({
  keyName,
  onConfirm,
  onCancel,
  loading,
}: {
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border-2 border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4B4B]/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#FF4B4B]" />
          </div>
          <div>
            <h3 className="font-bold text-base">Xóa key này?</h3>
            <p className="text-sm text-muted-foreground">Hành động không thể hoàn tác</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <code className="text-sm font-mono text-foreground break-all">{keyName}</code>
        </div>
        <p className="text-sm text-muted-foreground">
          Key sẽ bị xóa hoàn toàn khỏi file <code className="font-mono bg-muted px-1 rounded">.env</code>.
        </p>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1" disabled={loading}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-[#FF4B4B] hover:bg-[#e03e3e] text-white shadow-[0_2px_0_0_#c43030] hover:shadow-[0_1px_0_0_#c43030] hover:translate-y-[1px] transition-all"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
            Xóa
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Add key inline form ───────────────────────────────────────────────────

function AddKeyForm({
  defaultKeyName,
  freeKeyName,
  onSave,
  onCancel,
  isSaving,
}: {
  defaultKeyName?: string;
  freeKeyName?: boolean;
  onSave: (key: string, value: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [keyName, setKeyName] = useState(defaultKeyName ?? '');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  async function handleSave() {
    if (!keyName.trim()) { toast.error('Nhập tên key'); return; }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyName.trim())) {
      toast.error('Tên key chỉ được dùng chữ, số và _');
      return;
    }
    await onSave(keyName.trim(), value);
  }

  return (
    <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-muted/40 border border-dashed border-border">
      {freeKeyName ? (
        <Input
          value={keyName}
          onChange={(e) => setKeyName(e.target.value.toUpperCase())}
          placeholder="TEN_KEY_MOI"
          className="font-mono text-sm h-9 w-48 flex-shrink-0"
          autoFocus
        />
      ) : (
        <span className="font-mono text-sm w-48 flex-shrink-0 text-foreground">{keyName}</span>
      )}
      <div className="relative flex-1">
        <Input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Giá trị..."
          className="font-mono text-sm pr-10 h-9"
          autoFocus={!freeKeyName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button
          type="button"
          onClick={() => setShowValue(!showValue)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="h-9 bg-[#58CC02] hover:bg-[#46A302] text-white shadow-[0_2px_0_0_#46A302] hover:shadow-[0_1px_0_0_#46A302] hover:translate-y-[1px] transition-all flex-shrink-0"
      >
        {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} className="h-9 flex-shrink-0" disabled={isSaving}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Gemini Status Banner ──────────────────────────────────────────────────

function formatBlockedUntil(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function GeminiStatusBanner({ status }: { status: GeminiKeyStatus }) {
  const { currentKeyIndex, totalKeys, nextKeyIndex, keys, currentModel } = status;
  const blockedKeys = keys.filter((k) => !k.available);

  return (
    <div className="rounded-xl border border-[#1CB0F6]/30 bg-[#1CB0F6]/5 px-4 py-3 space-y-2 mb-1">
      {/* Dòng 1: Key đang dùng và next key */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />
          <span className="text-sm font-semibold text-foreground">
            Đang dùng Key #{currentKeyIndex}
          </span>
          <span className="text-xs text-muted-foreground">/ {totalKeys} keys</span>
        </div>
        {nextKeyIndex !== null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
            <span>Tiếp theo: Key #{nextKeyIndex}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-[#CE82FF]" />
          <span className="text-xs text-[#CE82FF] font-medium">{currentModel}</span>
        </div>
      </div>

      {/* Dòng 2: Keys bị block (nếu có) */}
      {blockedKeys.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="h-3 w-3 text-[#FF9600] flex-shrink-0" />
          <span className="text-xs text-[#FF9600]">
            {blockedKeys.length} key bị rate limit:
          </span>
          {blockedKeys.map((k) => (
            <span key={k.index} className="text-xs bg-[#FF9600]/10 text-[#FF9600] px-2 py-0.5 rounded-full">
              Key #{k.index}{k.blockedUntil ? ` → ${formatBlockedUntil(k.blockedUntil)}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Validation badge ─────────────────────────────────────────────────────

function ValidationBadge({ result }: { result: ApiKeyHealthItem | undefined }) {
  if (!result) return null;

  const cfg: Record<ApiKeyStatus, { label: string; icon: React.ElementType; cls: string }> = {
    valid:   { label: 'Hoạt động', icon: ShieldCheck, cls: 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/20' },
    invalid: { label: 'Không hợp lệ', icon: ShieldX,   cls: 'bg-[#FF4B4B]/10 text-[#FF4B4B] border-[#FF4B4B]/20' },
    error:   { label: 'Lỗi',         icon: ShieldAlert, cls: 'bg-[#FF9600]/10 text-[#FF9600] border-[#FF9600]/20' },
    missing: { label: 'Chưa đặt',   icon: Minus,       cls: 'bg-muted text-muted-foreground border-border' },
  };

  const { label, icon: Icon, cls } = cfg[result.status];
  const showMsg = result.status !== 'valid' && result.message;

  return (
    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
      <Badge className={`${cls} font-medium text-xs flex items-center gap-1 whitespace-nowrap`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      {showMsg && (
        <span className="text-[10px] text-muted-foreground max-w-[160px] text-right leading-tight">
          {result.message}
        </span>
      )}
    </div>
  );
}

// ── Key row ───────────────────────────────────────────────────────────────

function KeyRow({
  item,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  validationResult,
}: {
  item: EnvKeyItem;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  validationResult?: ApiKeyHealthItem;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function startEdit() {
    setLoadingRaw(true);
    try {
      // Dùng envDirectClient (Next.js server − đọc thẳng file) thay vì qua bot proxy
      // → tả đúng giá trị dù bot đang offline
      const res = await envDirectClient.getRaw(item.key);
      setInputValue(res.data.data?.value ?? '');
    } catch {
      setInputValue('');
    } finally {
      setLoadingRaw(false);
    }
    setEditing(true);
  }

  async function handleSave() {
    await onSave(item.key, inputValue);
    setEditing(false);
    setShowValue(false);
  }

  function handleCancel() {
    setEditing(false);
    setInputValue('');
    setShowValue(false);
  }

  return (
    <>
      {confirmDelete && (
        <ConfirmDeleteDialog
          keyName={item.key}
          onConfirm={() => { setConfirmDelete(false); onDelete(item.key); }}
          onCancel={() => setConfirmDelete(false)}
          loading={isDeleting}
        />
      )}
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group">
      {/* Status dot */}
      <div className="flex-shrink-0">
        {item.isSet ? (
          <CheckCircle2 className="h-4 w-4 text-[#58CC02]" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Key name */}
      <div className="flex-shrink-0 w-52 flex items-center gap-1.5">
        <span className="font-mono text-sm font-medium text-foreground">{item.key}</span>
        {(() => {
          const hint = getKeyHint(item.key);
          if (!hint) return null;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/50 hover:text-[#1CB0F6] transition-colors flex-shrink-0 cursor-help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3 space-y-2 bg-[#1a1a2e] border border-border text-foreground shadow-xl">
                <p className="text-xs leading-relaxed text-muted-foreground">{hint.desc}</p>
                {hint.url && (
                  <a
                    href={hint.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#1CB0F6] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Lấy key tại đây
                  </a>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })()}
      </div>

      {/* Value display / edit */}
      <div className="flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showValue ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập API key..."
                className="font-mono text-sm pr-10 h-9"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 bg-[#58CC02] hover:bg-[#46A302] text-white shadow-[0_2px_0_0_#46A302] hover:shadow-[0_1px_0_0_#46A302] hover:translate-y-[1px] transition-all"
            >
              {isSaving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-9"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className="font-mono text-sm text-muted-foreground">
            {item.isSet ? item.masked : <span className="italic text-muted-foreground/60">chưa đặt</span>}
          </span>
        )}
      </div>

      {/* Status badge: validation result nếu có, fallback isSet */}
      <div className="flex-shrink-0">
        {validationResult ? (
          <ValidationBadge result={validationResult} />
        ) : item.isSet ? (
          <Badge className="bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/20 font-medium text-xs">
            Đã đặt
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Trống
          </Badge>
        )}
      </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={startEdit}
              disabled={loadingRaw || isDeleting}
              className="h-8 w-8 p-0"
              title="Sửa"
            >
              {loadingRaw ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:text-[#FF4B4B] hover:bg-[#FF4B4B]/10"
              title="Xóa key"
            >
              {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function GroupCard({
  group,
  onSave,
  onDelete,
  savingKey,
  deletingKey,
  geminiStatus,
  validationMap,
}: {
  group: EnvGroup;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => void;
  savingKey: string | null;
  deletingKey: string | null;
  geminiStatus?: GeminiKeyStatus | null;
  validationMap?: Map<string, ApiKeyHealthItem>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);

  function suggestNextKey(): string | null {
    const pattern = /^(.+?)(\d+)$/;
    const nums: number[] = [];
    let prefix = '';
    for (const item of group.items) {
      const m = item.key.match(pattern);
      if (m) { prefix = m[1]; nums.push(parseInt(m[2], 10)); }
    }
    if (!prefix || nums.length === 0) return null;
    return `${prefix}${Math.max(...nums) + 1}`;
  }

  const nextKey = suggestNextKey();

  async function handleAdd(key: string, value: string) {
    await onSave(key, value);
    setAddingKey(null);
  }
  const Icon = GROUP_ICONS[group.group] ?? Key;
  const color = GROUP_COLORS[group.group] ?? 'text-muted-foreground';
  const bg = GROUP_BG[group.group] ?? 'bg-muted';

  const setCount = group.items.filter((i) => i.isSet).length;
  const total = group.items.length;

  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base">{group.group}</h3>
            <Badge
              className={`text-xs font-semibold ${
                setCount === total
                  ? 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/20'
                  : setCount === 0
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-[#FF9600]/10 text-[#FF9600] border-[#FF9600]/20'
              }`}
            >
              {setCount}/{total}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Keys */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {/* Gemini key status banner */}
          {group.group === 'Gemini API Keys' && geminiStatus && (
            <GeminiStatusBanner status={geminiStatus} />
          )}
          {group.items.map((item) => (
            <KeyRow
              key={item.key}
              item={item}
              onSave={onSave}
              onDelete={onDelete}
              isSaving={savingKey === item.key}
              isDeleting={deletingKey === item.key}
              validationResult={validationMap?.get(item.key)}
            />
          ))}

          {addingKey !== null ? (
            <AddKeyForm
              defaultKeyName={addingKey || undefined}
              freeKeyName={!addingKey}
              onSave={handleAdd}
              onCancel={() => setAddingKey(null)}
              isSaving={savingKey === addingKey}
            />
          ) : (
            <div className="flex gap-2 pt-1">
              {nextKey && (
                <button
                  type="button"
                  onClick={() => setAddingKey(nextKey)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Thêm {nextKey}
                </button>
              )}
              <button
                type="button"
                onClick={() => setAddingKey('')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-all"
              >
                <Plus className="h-3 w-3" />
                Thêm key tùy chỉnh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Custom keys section ───────────────────────────────────────────────────

function CustomKeysSection({
  customKeys,
  allGroupKeys,
  onSave,
  onDelete,
  savingKey,
  deletingKey,
}: {
  customKeys: { key: string; isSet: boolean; masked: string }[];
  allGroupKeys: Set<string>;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => void;
  savingKey: string | null;
  deletingKey: string | null;
}) {
  const [addingKey, setAddingKey] = useState(false);
  const filtered = customKeys.filter((k) => !allGroupKeys.has(k.key));

  if (filtered.length === 0 && !addingKey) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Key className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="font-bold text-base text-muted-foreground">Keys tùy chỉnh</h3>
            <p className="text-sm text-muted-foreground/60">Thêm key bất kỳ vào .env</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddingKey(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-all"
        >
          <Plus className="h-3 w-3" />
          Thêm key
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <Key className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">Keys tùy chỉnh</h3>
          <p className="text-sm text-muted-foreground">Các key không thuộc nhóm nào</p>
        </div>
        <Badge className="bg-muted text-muted-foreground border-border text-xs">{filtered.length}</Badge>
      </div>
      <div className="px-4 pb-4 pt-2 space-y-2">
        {filtered.map((item) => (
          <KeyRow
            key={item.key}
            item={{ key: item.key, masked: item.masked, isSet: item.isSet, isEmpty: !item.isSet }}
            onSave={onSave}
            onDelete={onDelete}
            isSaving={savingKey === item.key}
            isDeleting={deletingKey === item.key}
          />
        ))}
        {addingKey ? (
          <AddKeyForm
            freeKeyName
            onSave={async (k, v) => { await onSave(k, v); setAddingKey(false); }}
            onCancel={() => setAddingKey(false)}
            isSaving={false}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingKey(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-all mt-1"
          >
            <Plus className="h-3 w-3" />
            Thêm key mới
          </button>
        )}
      </div>
    </div>
  );
}

export default function EnvKeysPage() {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanTime, setScanTime] = useState<Date | null>(null);
  const [validationMap, setValidationMap] = useState<Map<string, ApiKeyHealthItem>>(new Map());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['env-keys'],
    queryFn: async () => {
      const res = await envApiClient.getGroups();
      return res.data.data;
    },
  });

  const { data: geminiStatus } = useQuery({
    queryKey: ['gemini-key-status'],
    queryFn: async () => {
      const res = await envApiClient.getGeminiStatus();
      return res.data.data ?? null;
    },
    refetchInterval: 10000,
  });

  const { data: directData } = useQuery({
    queryKey: ['env-direct'],
    queryFn: async () => {
      const res = await envDirectClient.list();
      return res.data.data?.keys ?? [];
    },
  });

  async function handleScan(force = false) {
    setScanning(true);
    try {
      const res = await envApiClient.validate(force);
      const results = res.data.data?.results ?? [];
      const map = new Map<string, ApiKeyHealthItem>();
      for (const r of results) map.set(r.key, r);
      setValidationMap(map);
      setScanTime(new Date());
      const valid = results.filter((r) => r.status === 'valid').length;
      const invalid = results.filter((r) => r.status === 'invalid').length;
      const errors = results.filter((r) => r.status === 'error').length;
      await refetch();
      toast.success(`Quét xong: ${valid} hoạt động, ${invalid} lỗi key, ${errors} lỗi kết nối`);
    } catch {
      toast.error('Không thể quét — bot offline?');
    } finally {
      setScanning(false);
    }
  }

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      envDirectClient.set(key, value),
    onSuccess: (_res, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['env-keys'] });
      queryClient.invalidateQueries({ queryKey: ['env-direct'] });
      toast.success(`Đã lưu ${key}`);
    },
    onError: () => toast.error('Lỗi khi lưu key'),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => envDirectClient.remove(key),
    onSuccess: (_res, key) => {
      queryClient.invalidateQueries({ queryKey: ['env-keys'] });
      queryClient.invalidateQueries({ queryKey: ['env-direct'] });
      toast.success(`Đã xóa ${key}`);
    },
    onError: () => toast.error('Lỗi khi xóa key'),
  });

  async function handleSave(key: string, value: string) {
    setSavingKey(key);
    try {
      await updateMutation.mutateAsync({ key, value });
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDelete(key: string) {
    setDeletingKey(key);
    try {
      await deleteMutation.mutateAsync(key);
    } finally {
      setDeletingKey(null);
    }
  }

  const groups = data?.groups ?? [];
  const allGroupKeys = new Set(groups.flatMap((g) => g.items.map((i) => i.key)));
  const totalSet = groups.reduce((sum, g) => sum + g.items.filter((i) => i.isSet).length, 0);
  const totalKeys = groups.reduce((sum, g) => sum + g.items.length, 0);

  // Validation summary (after scan)
  const scanResults = [...validationMap.values()];
  const validCount = scanResults.filter((r) => r.status === 'valid').length;
  const invalidCount = scanResults.filter((r) => r.status === 'invalid' || r.status === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1CB0F6]/10">
            <Key className="h-6 w-6 text-[#1CB0F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
            <p className="text-sm text-muted-foreground">Quản lý các API keys trong file .env</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScan(true)}
            disabled={scanning || isLoading}
            className="gap-2 border-[#1CB0F6]/30 text-[#1CB0F6] hover:bg-[#1CB0F6]/10 hover:text-[#1CB0F6]"
          >
            {scanning || isLoading
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <ScanLine className="h-4 w-4" />}
            {scanning ? 'Đang quét...' : isLoading ? 'Đang tải...' : 'Quét & Tải lại'}
          </Button>
        </div>
      </div>

      {/* Summary stat */}
      {!isLoading && totalKeys > 0 && (
        <div className="p-4 rounded-2xl border-2 border-border bg-card space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Đã cấu hình</span>
                <span className="text-sm font-bold">{totalSet}/{totalKeys} keys</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#58CC02] transition-all duration-500"
                  style={{ width: `${(totalSet / totalKeys) * 100}%` }}
                />
              </div>
            </div>
            <div className={`flex-shrink-0 text-2xl font-bold ${totalSet === totalKeys ? 'text-[#58CC02]' : 'text-[#FF9600]'}`}>
              {Math.round((totalSet / totalKeys) * 100)}%
            </div>
          </div>

          {/* Scan result summary */}
          {scanResults.length > 0 && (
            <div className="flex items-center gap-3 pt-1 border-t border-border/50 flex-wrap">
              <span className="text-xs text-muted-foreground">
                Kết quả quét{scanTime ? ` lúc ${scanTime.toLocaleTimeString('vi-VN')}` : ''}:
              </span>
              <span className="flex items-center gap-1 text-xs text-[#58CC02]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {validCount} hoạt động
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-[#FF4B4B]">
                  <ShieldX className="h-3.5 w-3.5" />
                  {invalidCount} lỗi
                </span>
              )}
              <button
                type="button"
                onClick={() => handleScan(true)}
                disabled={scanning}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${scanning ? 'animate-spin' : ''}`} />
                Quét lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Groups */}
      {!isLoading && (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard
              key={group.group}
              group={group}
              onSave={handleSave}
              onDelete={handleDelete}
              savingKey={savingKey}
              deletingKey={deletingKey}
              geminiStatus={group.group === 'Gemini API Keys' ? geminiStatus : undefined}
              validationMap={validationMap.size > 0 ? validationMap : undefined}
            />
          ))}

          <CustomKeysSection
            customKeys={directData ?? []}
            allGroupKeys={allGroupKeys}
            onSave={handleSave}
            onDelete={handleDelete}
            savingKey={savingKey}
            deletingKey={deletingKey}
          />
        </div>
      )}

      {/* Note */}
      <div className="p-4 rounded-2xl bg-muted/50 border border-border text-sm text-muted-foreground">
        <strong>Lưu ý:</strong> Thay đổi key sẽ cập nhật trực tiếp vào file{' '}
        <code className="font-mono bg-muted px-1 rounded">.env</code>. Bot cần khởi động lại để áp dụng các key mới (trừ Gemini keys — bot tự tải lại khi restart).
      </div>
    </div>
  );
}
