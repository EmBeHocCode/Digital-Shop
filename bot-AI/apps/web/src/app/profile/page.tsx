'use client';

import { type ChangeEvent, type CSSProperties, type ElementType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApiClient, type BotSettings, type DashboardProfiles, type UserProfileData } from '@/lib/api';
import { toast } from 'sonner';
import { AvatarCropDialog } from '@/components/ui/avatar-crop-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bot, Film, ImagePlus, Palette, RotateCcw, Trash2, User } from 'lucide-react';

type ProfileTarget = 'admin' | 'bot';
type NameEffect = 'solid' | 'mix' | 'rainbow';
type BorderAnimMode = 'multi' | 'single';
type BorderAnimEffect = 'corners' | 'corners-neon' | 'electric' | 'neon';
const MAX_COVER_UPLOAD_MB = 500;
const MAX_COVER_UPLOAD_BYTES = MAX_COVER_UPLOAD_MB * 1024 * 1024;
const COVER_DB_NAME = 'dashboard-profile-covers';
const COVER_STORE = 'covers';

const EMPTY_PROFILE: UserProfileData = {
  displayName: '',
  pronouns: '',
  bio: '',
  avatarUrl: '',
  coverUrl: '',
};

interface ProfileStyle {
  styleVersion: number;
  adminNeon: string;
  botNeon: string;
  borderAnimColor1: string;
  borderAnimColor2: string;
  borderAnimColor3: string;
  borderAnimColor4: string;
  borderAnimMode: BorderAnimMode;
  borderAnimEffect: BorderAnimEffect;
  borderAnimSingleColor: string;
  borderAnimSpeedSec: number;
  adminGlow: string;
  botGlow: string;
  adminCardBg: string;
  botCardBg: string;
  nameFont: string;
  adminNameColor: string;
  adminNameColor2: string;
  botNameColor: string;
  botNameColor2: string;
  adminNameEffect: NameEffect;
  botNameEffect: NameEffect;
}

const PROFILE_STYLE_KEY = 'profile-card-style';

const DEFAULT_STYLE: ProfileStyle = {
  styleVersion: 3,
  adminNeon: '#1CB0F6',
  botNeon: '#ff006e',
  borderAnimColor1: '#1CB0F6',
  borderAnimColor2: '#CE82FF',
  borderAnimColor3: '#ff006e',
  borderAnimColor4: '#58CC02',
  borderAnimMode: 'multi',
  borderAnimEffect: 'corners',
  borderAnimSingleColor: '#1CB0F6',
  borderAnimSpeedSec: 5,
  adminGlow: '#1CB0F6',
  botGlow: '#ff006e',
  adminCardBg: '#0d0f14',
  botCardBg: '#0d0f14',
  nameFont: 'inherit',
  adminNameColor: '#ffffff',
  adminNameColor2: '#1CB0F6',
  botNameColor: '#ffffff',
  botNameColor2: '#ff006e',
  adminNameEffect: 'rainbow',
  botNameEffect: 'rainbow',
};

const FONT_OPTIONS = [
  { label: 'System (mặc định)', value: 'inherit' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet', value: "'Trebuchet MS', sans-serif" },
  { label: 'Century Gothic', value: "'Century Gothic', 'Futura', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Lucida Console', value: "'Lucida Console', Monaco, monospace" },
  { label: 'Comic Sans', value: "'Comic Sans MS', cursive" },
  { label: 'Impact', value: "'Impact', 'Arial Narrow', sans-serif" },
];

const KEYFRAMES = `
  @property --border-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  @keyframes neon-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes rainbow-shift {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes mix-shift {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes card-neon-pulse {
    0%, 100% {
      box-shadow: 0 0 0 1px var(--neon-soft), 0 16px 40px rgba(0,0,0,0.35);
    }
    50% {
      box-shadow: 0 0 0 1px var(--neon-strong), 0 0 28px var(--neon-soft), 0 16px 40px rgba(0,0,0,0.35);
    }
  }
  @keyframes border-angle-spin {
    from { --border-angle: 0deg; }
    to   { --border-angle: 360deg; }
  }
  @keyframes lightning-jitter {
    0%   { background-position: 0 0, 0 0, 0 0; }
    25%  { background-position: 0 0, 2px -1px, -1px 2px; }
    50%  { background-position: 0 0, -2px 1px, 1px -2px; }
    75%  { background-position: 0 0, 1px 2px, -2px -1px; }
    100% { background-position: 0 0, 0 0, 0 0; }
  }
  @keyframes electric-surge-x {
    0% { background-position: -220px 0, 0 0; }
    100% { background-position: 220px 0, 180px 0; }
  }
  @keyframes electric-surge-y {
    0% { background-position: 0 -220px, 0 0; }
    100% { background-position: 0 220px, 0 180px; }
  }
  @keyframes electric-orb-drift {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .45; }
    50% { transform: translate3d(6px, -5px, 0) scale(1.1); opacity: .75; }
  }
  @keyframes neon-corner-pulse {
    0%, 100% { opacity: .92; }
    50% { opacity: 1; }
  }
  @keyframes electric-run-h {
    0% { transform: translateX(-24px); }
    100% { transform: translateX(calc(100% + 24px)); }
  }
  @keyframes electric-run-v {
    0% { transform: translateY(-24px); }
    100% { transform: translateY(calc(100% + 24px)); }
  }
  @keyframes avatar-glow-pulse {
    0%, 100% {
      box-shadow: 0 0 0 3px var(--glow-soft), 0 0 18px var(--glow-soft);
    }
    50% {
      box-shadow: 0 0 0 4px var(--glow-strong), 0 0 30px var(--glow-strong), 0 0 44px var(--glow-soft);
    }
  }
`;

function isVideoSource(source: string | null | undefined): boolean {
  if (!source) return false;
  const lower = source.toLowerCase().trim();
  if (!lower) return false;
  if (lower.startsWith('blob:') || lower.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(lower);
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((ch) => ch + ch).join('')
    : value.padEnd(6, '0').slice(0, 6);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(alpha, 1))})`;
}

function openCoverDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(COVER_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(COVER_STORE)) {
        db.createObjectStore(COVER_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Không mở được IndexedDB'));
  });
}

async function loadCoverVideoBlob(target: ProfileTarget): Promise<Blob | null> {
  const db = await openCoverDb();
  return new Promise((resolve) => {
    const tx = db.transaction(COVER_STORE, 'readonly');
    const req = tx.objectStore(COVER_STORE).get(`${target}-cover-video`);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => resolve(null);
  });
}

async function saveCoverVideoBlob(target: ProfileTarget, blob: Blob): Promise<void> {
  const db = await openCoverDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_STORE, 'readwrite');
    tx.objectStore(COVER_STORE).put(blob, `${target}-cover-video`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Không lưu được video bìa'));
  });
}

async function deleteCoverVideoBlob(target: ProfileTarget): Promise<void> {
  const db = await openCoverDb();
  return new Promise((resolve) => {
    const tx = db.transaction(COVER_STORE, 'readwrite');
    tx.objectStore(COVER_STORE).delete(`${target}-cover-video`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function useProfileStyle() {
  const [style, setStyle] = useState<ProfileStyle>(DEFAULT_STYLE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STYLE_KEY);
      if (raw) setStyle({ ...DEFAULT_STYLE, ...JSON.parse(raw) });
    } catch {
      // ignore invalid style
    }
  }, []);

  const update = useCallback((patch: Partial<ProfileStyle>) => {
    setStyle((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PROFILE_STYLE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota error
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setStyle(DEFAULT_STYLE);
    try {
      localStorage.removeItem(PROFILE_STYLE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { style, update, reset };
}

function buildNameStyle(target: ProfileTarget, style: ProfileStyle): CSSProperties {
  const isAdmin = target === 'admin';
  const effect = isAdmin ? style.adminNameEffect : style.botNameEffect;
  const color1 = isAdmin ? style.adminNameColor : style.botNameColor;
  const color2 = isAdmin ? style.adminNameColor2 : style.botNameColor2;

  const base: CSSProperties = { fontFamily: style.nameFont };

  if (effect === 'solid') {
    return { ...base, color: color1 };
  }
  if (effect === 'mix') {
    return {
      ...base,
      backgroundImage: `linear-gradient(90deg, ${color1}, ${color2}, ${color1})`,
      backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      animation: 'mix-shift 4s linear infinite',
    };
  }
  return {
    ...base,
    backgroundImage:
      'linear-gradient(90deg, #ff0000, #ff7a00, #ffee00, #00ff00, #00c8ff, #0000ff, #a000ff, #ff0000)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    animation: 'rainbow-shift 7s linear infinite',
  };
}

function normalizeProfile(input: UserProfileData | undefined | null): UserProfileData {
  return {
    ...EMPTY_PROFILE,
    ...(input ?? {}),
  };
}

function buildProfiles(settings: BotSettings | null | undefined): DashboardProfiles {
  return {
    admin: normalizeProfile(settings?.profiles?.admin),
    bot: normalizeProfile(settings?.profiles?.bot),
  };
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });
}

function StyleMenu({
  style,
  update,
  reset,
}: {
  style: ProfileStyle;
  update: (patch: Partial<ProfileStyle>) => void;
  reset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'card' | 'avatar' | 'text'>('card');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden"
          style={{ boxShadow: `0 0 0 1px ${style.adminNeon}30, 0 20px 60px rgba(0,0,0,0.7)` }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#CE82FF]" />
              <span className="text-sm font-bold">Tuỳ chỉnh giao diện profile</span>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="flex border-b border-border">
            {(['card', 'avatar', 'text'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
                  tab === value
                    ? 'text-[#CE82FF] border-[#CE82FF]'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                {value === 'card' ? 'Viền thẻ' : value === 'avatar' ? 'Viền avatar' : 'Tên hiển thị'}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {tab === 'card' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Màu viền Admin</label>
                  <input type="color" value={style.adminNeon} onChange={(e) => update({ adminNeon: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Màu viền Bot</label>
                  <input type="color" value={style.botNeon} onChange={(e) => update({ botNeon: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
                <div className="pt-1 border-t border-border/70 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Màu động chạy quanh viền</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hiệu ứng viền</label>
                    <Select value={style.borderAnimEffect} onValueChange={(value) => update({ borderAnimEffect: value as BorderAnimEffect })}>
                      <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corners">4 góc mảnh (mặc định)</SelectItem>
                        <SelectItem value="corners-neon">4 góc neon sáng</SelectItem>
                        <SelectItem value="electric">Tia điện chạy viền</SelectItem>
                        <SelectItem value="neon">Neon liền mượt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Kiểu màu viền động</label>
                    <Select value={style.borderAnimMode} onValueChange={(value) => update({ borderAnimMode: value as BorderAnimMode })}>
                      <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multi">Mix 4 màu (4 góc)</SelectItem>
                        <SelectItem value="single">Đồng bộ 1 màu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {style.borderAnimMode === 'single' && (
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Màu đồng bộ</label>
                      <input
                        type="color"
                        value={style.borderAnimSingleColor}
                        onChange={(e) => update({ borderAnimSingleColor: e.target.value })}
                        className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent"
                      />
                    </div>
                  )}
                  {style.borderAnimMode === 'multi' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Góc 1</label>
                        <input type="color" value={style.borderAnimColor1} onChange={(e) => update({ borderAnimColor1: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Góc 2</label>
                        <input type="color" value={style.borderAnimColor2} onChange={(e) => update({ borderAnimColor2: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Góc 3</label>
                        <input type="color" value={style.borderAnimColor3} onChange={(e) => update({ borderAnimColor3: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Góc 4</label>
                        <input type="color" value={style.borderAnimColor4} onChange={(e) => update({ borderAnimColor4: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs text-muted-foreground">Tốc độ chạy viền ({style.borderAnimSpeedSec.toFixed(1)}s/vòng)</label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={style.borderAnimSpeedSec}
                      onChange={(e) => update({ borderAnimSpeedSec: Number(e.target.value) })}
                      className="w-full accent-[#CE82FF]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Nền thẻ Admin</label>
                  <input type="color" value={style.adminCardBg} onChange={(e) => update({ adminCardBg: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Nền thẻ Bot</label>
                  <input type="color" value={style.botCardBg} onChange={(e) => update({ botCardBg: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
              </>
            )}

            {tab === 'avatar' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Glow avatar Admin</label>
                  <input type="color" value={style.adminGlow} onChange={(e) => update({ adminGlow: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Glow avatar Bot</label>
                  <input type="color" value={style.botGlow} onChange={(e) => update({ botGlow: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                </div>
              </>
            )}

            {tab === 'text' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Kiểu chữ tên</label>
                  <Select value={style.nameFont} onValueChange={(value) => update({ nameFont: value })}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border p-2 space-y-2">
                  <p className="text-xs font-semibold">Tên Admin</p>
                  <Select value={style.adminNameEffect} onValueChange={(value) => update({ adminNameEffect: value as NameEffect })}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">1 màu</SelectItem>
                      <SelectItem value="mix">Mix 2 màu</SelectItem>
                      <SelectItem value="rainbow">7 màu</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Màu 1</label>
                    <input type="color" value={style.adminNameColor} onChange={(e) => update({ adminNameColor: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Màu 2</label>
                    <input type="color" value={style.adminNameColor2} onChange={(e) => update({ adminNameColor2: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-2 space-y-2">
                  <p className="text-xs font-semibold">Tên Bot</p>
                  <Select value={style.botNameEffect} onValueChange={(value) => update({ botNameEffect: value as NameEffect })}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">1 màu</SelectItem>
                      <SelectItem value="mix">Mix 2 màu</SelectItem>
                      <SelectItem value="rainbow">7 màu</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Màu 1</label>
                    <input type="color" value={style.botNameColor} onChange={(e) => update({ botNameColor: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Màu 2</label>
                    <input type="color" value={style.botNameColor2} onChange={(e) => update({ botNameColor2: e.target.value })} className="w-9 h-7 rounded-lg cursor-pointer border border-border bg-transparent" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{
          background: 'conic-gradient(#CE82FF, #1CB0F6, #ff006e, #CE82FF)',
          boxShadow: open
            ? '0 0 30px #CE82FF90, 0 0 60px #CE82FF40, 0 4px 16px rgba(0,0,0,0.5)'
            : '0 0 16px #CE82FF60, 0 4px 12px rgba(0,0,0,0.4)',
          animation: 'neon-spin 6s linear infinite',
        }}
        title="Mở studio giao diện"
      >
        <Palette className="h-5 w-5 text-white" style={{ animation: 'neon-spin 6s linear infinite reverse' }} />
      </button>
    </div>
  );
}

function ProfilePreview({
  target,
  roleLabel,
  roleIcon: RoleIcon,
  profile,
  coverOverride,
  fallbackName,
  onEdit,
  styleConfig,
}: {
  target: ProfileTarget;
  roleLabel: string;
  roleIcon: ElementType;
  profile: UserProfileData;
  coverOverride?: string | null;
  fallbackName: string;
  onEdit: () => void;
  styleConfig: ProfileStyle;
}) {
  const displayName = profile.displayName.trim() || fallbackName;
  const coverUrl = (coverOverride ?? profile.coverUrl).trim();
  const coverIsVideo = isVideoSource(coverUrl);
  const neon = target === 'admin' ? styleConfig.adminNeon : styleConfig.botNeon;
  const glow = target === 'admin' ? styleConfig.adminGlow : styleConfig.botGlow;
  const cardBg = target === 'admin' ? styleConfig.adminCardBg : styleConfig.botCardBg;
  const nameStyle = buildNameStyle(target, styleConfig);
  const avatarFallback = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || 'U';
  const cardStyle: CSSProperties = {
    background: cardBg,
    boxShadow: `0 0 0 1px ${neon}24, 0 16px 40px rgba(0,0,0,0.35)`,
  };
  const borderC1 = styleConfig.borderAnimMode === 'single' ? styleConfig.borderAnimSingleColor : styleConfig.borderAnimColor1;
  const borderC2 = styleConfig.borderAnimMode === 'single' ? styleConfig.borderAnimSingleColor : styleConfig.borderAnimColor2;
  const borderC3 = styleConfig.borderAnimMode === 'single' ? styleConfig.borderAnimSingleColor : styleConfig.borderAnimColor3;
  const borderC4 = styleConfig.borderAnimMode === 'single' ? styleConfig.borderAnimSingleColor : styleConfig.borderAnimColor4;
  const isElectric = styleConfig.borderAnimEffect === 'electric';
  const isCornersNeon = styleConfig.borderAnimEffect === 'corners-neon';
  const cornersBaseGlow = `conic-gradient(
    from var(--border-angle, 0deg),
    ${hexToRgba(borderC1, 0.3)} 0deg,
    ${hexToRgba(borderC2, 0.3)} 90deg,
    ${hexToRgba(borderC3, 0.3)} 180deg,
    ${hexToRgba(borderC4, 0.3)} 270deg,
    ${hexToRgba(borderC1, 0.3)} 360deg
  )`;
  const cornersPattern = `conic-gradient(
    from var(--border-angle, 0deg),
    ${hexToRgba(borderC1, 1)} 0deg 7deg,
    transparent 7deg 90deg,
    ${hexToRgba(borderC2, 1)} 90deg 97deg,
    transparent 97deg 180deg,
    ${hexToRgba(borderC3, 1)} 180deg 187deg,
    transparent 187deg 270deg,
    ${hexToRgba(borderC4, 1)} 270deg 277deg,
    transparent 277deg 360deg
  )`;
  const borderPattern =
    isElectric
      ? `linear-gradient(180deg, ${hexToRgba(borderC1, 0.18)}, ${hexToRgba(borderC4, 0.18)})`
      : styleConfig.borderAnimEffect === 'neon'
        ? `conic-gradient(
            from var(--border-angle, 0deg),
            ${hexToRgba(borderC1, 0.2)} 0deg,
            ${hexToRgba(borderC1, 1)} 45deg,
            ${hexToRgba(borderC2, 1)} 120deg,
            ${hexToRgba(borderC3, 1)} 210deg,
            ${hexToRgba(borderC4, 1)} 300deg,
            ${hexToRgba(borderC1, 0.2)} 360deg
          )`
        : isCornersNeon
        ? `${cornersPattern},
            conic-gradient(
              from var(--border-angle, 0deg),
              ${hexToRgba('#ffffff', 0.24)} 0deg 11deg,
              transparent 11deg 90deg,
              ${hexToRgba('#ffffff', 0.24)} 90deg 101deg,
              transparent 101deg 180deg,
              ${hexToRgba('#ffffff', 0.24)} 180deg 191deg,
              transparent 191deg 270deg,
              ${hexToRgba('#ffffff', 0.24)} 270deg 281deg,
              transparent 281deg 360deg
            ),
            ${cornersBaseGlow}`
          : `${cornersPattern}, ${cornersBaseGlow}`;
  const borderSpinStyle: CSSProperties = {
    backgroundImage: borderPattern,
    animation: isElectric
      ? undefined
      : isCornersNeon
        ? `border-angle-spin ${Math.max(0.5, styleConfig.borderAnimSpeedSec)}s linear infinite, neon-corner-pulse 1.5s ease-in-out infinite`
        : `border-angle-spin ${Math.max(0.5, styleConfig.borderAnimSpeedSec)}s linear infinite`,
    backgroundColor: '#0b0d12',
    backgroundBlendMode: isElectric ? undefined : 'normal, screen',
    willChange: 'background-image',
    backfaceVisibility: 'hidden',
    boxShadow: isElectric
      ? `0 0 12px ${hexToRgba(borderC1, 0.5)}, 0 0 22px ${hexToRgba(borderC2, 0.35)}, 0 0 34px ${hexToRgba(borderC4, 0.25)}`
      : isCornersNeon
        ? `0 0 10px ${hexToRgba(borderC1, 0.55)}, 0 0 18px ${hexToRgba(borderC2, 0.4)}, 0 0 30px ${hexToRgba(borderC3, 0.33)}, 0 0 44px ${hexToRgba(borderC4, 0.26)}`
        : undefined,
  };
  const electricH1Style: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${hexToRgba(borderC1, 0)} 0%, ${hexToRgba(borderC1, 0.95)} 26%, ${hexToRgba('#ffffff', 0.98)} 50%, ${hexToRgba(borderC2, 0.95)} 74%, ${hexToRgba(borderC2, 0)} 100%), repeating-linear-gradient(90deg, transparent 0 11px, ${hexToRgba('#ffffff', 0.65)} 11px 13px, transparent 13px 22px)`,
    backgroundSize: '220px 100%, 160px 100%',
    animation: `electric-surge-x ${Math.max(0.65, styleConfig.borderAnimSpeedSec * 0.35)}s linear infinite`,
    boxShadow: `0 0 10px ${hexToRgba(borderC1, 0.85)}, 0 0 20px ${hexToRgba(borderC2, 0.65)}`,
  };
  const electricV1Style: CSSProperties = {
    backgroundImage: `linear-gradient(180deg, ${hexToRgba(borderC1, 0)} 0%, ${hexToRgba(borderC1, 0.95)} 26%, ${hexToRgba('#ffffff', 0.98)} 50%, ${hexToRgba(borderC2, 0.95)} 74%, ${hexToRgba(borderC2, 0)} 100%), repeating-linear-gradient(180deg, transparent 0 11px, ${hexToRgba('#ffffff', 0.6)} 11px 13px, transparent 13px 22px)`,
    backgroundSize: '100% 220px, 100% 160px',
    animation: `electric-surge-y ${Math.max(0.65, styleConfig.borderAnimSpeedSec * 0.35)}s linear infinite`,
    boxShadow: `0 0 10px ${hexToRgba(borderC1, 0.85)}, 0 0 20px ${hexToRgba(borderC2, 0.65)}`,
  };
  const electricH2Style: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${hexToRgba(borderC3, 0)} 0%, ${hexToRgba(borderC3, 0.95)} 26%, ${hexToRgba('#ffffff', 0.98)} 50%, ${hexToRgba(borderC4, 0.95)} 74%, ${hexToRgba(borderC4, 0)} 100%), repeating-linear-gradient(90deg, transparent 0 11px, ${hexToRgba('#ffffff', 0.6)} 11px 13px, transparent 13px 22px)`,
    backgroundSize: '220px 100%, 160px 100%',
    animation: `electric-surge-x ${Math.max(0.68, styleConfig.borderAnimSpeedSec * 0.37)}s linear infinite reverse`,
    boxShadow: `0 0 10px ${hexToRgba(borderC3, 0.85)}, 0 0 20px ${hexToRgba(borderC4, 0.65)}`,
  };
  const electricV2Style: CSSProperties = {
    backgroundImage: `linear-gradient(180deg, ${hexToRgba(borderC3, 0)} 0%, ${hexToRgba(borderC3, 0.95)} 26%, ${hexToRgba('#ffffff', 0.98)} 50%, ${hexToRgba(borderC4, 0.95)} 74%, ${hexToRgba(borderC4, 0)} 100%), repeating-linear-gradient(180deg, transparent 0 11px, ${hexToRgba('#ffffff', 0.6)} 11px 13px, transparent 13px 22px)`,
    backgroundSize: '100% 220px, 100% 160px',
    animation: `electric-surge-y ${Math.max(0.68, styleConfig.borderAnimSpeedSec * 0.37)}s linear infinite reverse`,
    boxShadow: `0 0 10px ${hexToRgba(borderC3, 0.85)}, 0 0 20px ${hexToRgba(borderC4, 0.65)}`,
  };
  const electricSparkH1Style: CSSProperties = {
    background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(borderC1, 0.8)} 25%, ${hexToRgba('#ffffff', 1)} 50%, ${hexToRgba(borderC2, 0.8)} 75%, transparent 100%)`,
    boxShadow: `0 0 6px ${hexToRgba('#ffffff', 0.95)}, 0 0 14px ${hexToRgba(borderC1, 0.85)}`,
    animation: `electric-run-h ${Math.max(0.7, styleConfig.borderAnimSpeedSec * 0.28)}s linear infinite`,
  };
  const electricSparkV1Style: CSSProperties = {
    background: `linear-gradient(180deg, transparent 0%, ${hexToRgba(borderC1, 0.8)} 25%, ${hexToRgba('#ffffff', 1)} 50%, ${hexToRgba(borderC2, 0.8)} 75%, transparent 100%)`,
    boxShadow: `0 0 6px ${hexToRgba('#ffffff', 0.95)}, 0 0 14px ${hexToRgba(borderC1, 0.85)}`,
    animation: `electric-run-v ${Math.max(0.7, styleConfig.borderAnimSpeedSec * 0.28)}s linear infinite`,
  };
  const electricSparkH2Style: CSSProperties = {
    background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(borderC3, 0.8)} 25%, ${hexToRgba('#ffffff', 1)} 50%, ${hexToRgba(borderC4, 0.8)} 75%, transparent 100%)`,
    boxShadow: `0 0 6px ${hexToRgba('#ffffff', 0.95)}, 0 0 14px ${hexToRgba(borderC3, 0.85)}`,
    animation: `electric-run-h ${Math.max(0.7, styleConfig.borderAnimSpeedSec * 0.3)}s linear infinite reverse`,
  };
  const electricSparkV2Style: CSSProperties = {
    background: `linear-gradient(180deg, transparent 0%, ${hexToRgba(borderC3, 0.8)} 25%, ${hexToRgba('#ffffff', 1)} 50%, ${hexToRgba(borderC4, 0.8)} 75%, transparent 100%)`,
    boxShadow: `0 0 6px ${hexToRgba('#ffffff', 0.95)}, 0 0 14px ${hexToRgba(borderC3, 0.85)}`,
    animation: `electric-run-v ${Math.max(0.7, styleConfig.borderAnimSpeedSec * 0.3)}s linear infinite reverse`,
  };
  const avatarStyle: CSSProperties & Record<string, string | number> = {
    '--glow-soft': `${glow}88`,
    '--glow-strong': `${glow}ff`,
    background: `${neon}`,
    boxShadow: `0 0 0 3px ${glow}80, 0 0 24px ${glow}66`,
    animation: 'avatar-glow-pulse 2.2s ease-in-out infinite',
  };

  return (
    <div className="relative isolate self-start h-fit w-full rounded-2xl p-[2px] overflow-hidden" style={{ ...borderSpinStyle, contain: 'paint' }}>
      {isElectric ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1.5 top-1.5 h-[2.5px] w-[42%] rounded-full overflow-hidden" style={electricH1Style}>
            <div className="absolute inset-y-0 w-8 rounded-full" style={electricSparkH1Style} />
          </div>
          <div className="absolute left-1.5 top-1.5 w-[2.5px] h-[42%] rounded-full overflow-hidden" style={electricV1Style}>
            <div className="absolute inset-x-0 h-8 rounded-full" style={electricSparkV1Style} />
          </div>
          <div className="absolute right-1.5 bottom-1.5 h-[2.5px] w-[42%] rounded-full overflow-hidden" style={electricH2Style}>
            <div className="absolute inset-y-0 w-8 rounded-full" style={electricSparkH2Style} />
          </div>
          <div className="absolute right-1.5 bottom-1.5 w-[2.5px] h-[42%] rounded-full overflow-hidden" style={electricV2Style}>
            <div className="absolute inset-x-0 h-8 rounded-full" style={electricSparkV2Style} />
          </div>
          <div
            className="absolute left-0 top-0 w-24 h-24 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, ${hexToRgba(borderC1, 0.35)} 0%, ${hexToRgba(borderC2, 0.12)} 45%, transparent 72%)`,
              animation: 'electric-orb-drift 2.8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute right-0 bottom-0 w-24 h-24 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, ${hexToRgba(borderC3, 0.35)} 0%, ${hexToRgba(borderC4, 0.12)} 45%, transparent 72%)`,
              animation: 'electric-orb-drift 3.2s ease-in-out infinite reverse',
            }}
          />
        </div>
      ) : null}
      <div className="relative rounded-[15px] overflow-hidden border border-black/30" style={cardStyle}>
      <div className="relative z-0 h-28 w-full bg-muted/30">
        {coverUrl ? (
          coverIsVideo ? (
            <video src={coverUrl} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#1CB0F6_0%,#CE82FF_50%,#ff006e_100%)] opacity-75" />
        )}
      </div>

      <div className="relative z-10 px-5 pb-5">
        <div
          className="relative z-20 -mt-12 mb-3 w-24 h-24 rounded-full border-4 border-card overflow-hidden flex items-center justify-center text-2xl font-bold text-white"
          style={avatarStyle}
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            avatarFallback
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-2xl font-bold leading-tight" style={nameStyle}>
              {displayName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <RoleIcon className="h-3.5 w-3.5" />
              <span>{roleLabel}</span>
              {profile.pronouns.trim() && <Badge variant="secondary">{profile.pronouns.trim()}</Badge>}
            </div>
          </div>
          <Button onClick={onEdit} variant="outline" className="rounded-xl border-2">
            <Palette className="h-4 w-4 mr-2" />
            Mở Studio
          </Button>
        </div>

        <p className="mt-4 text-sm whitespace-pre-wrap text-muted-foreground min-h-12">
          {profile.bio.trim() || 'Chưa có tiểu sử.'}
        </p>
      </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { style, update, reset } = useProfileStyle();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApiClient.get();
      if (res.data?.botOffline) return null;
      return (res.data.data ?? null) as BotSettings | null;
    },
  });

  const [profiles, setProfiles] = useState<DashboardProfiles>(buildProfiles(null));
  const [coverVideoUrls, setCoverVideoUrls] = useState<Record<ProfileTarget, string | null>>({
    admin: null,
    bot: null,
  });
  const coverVideoUrlsRef = useRef<Record<ProfileTarget, string | null>>({
    admin: null,
    bot: null,
  });
  const [editingTarget, setEditingTarget] = useState<ProfileTarget | null>(null);
  const [draft, setDraft] = useState<UserProfileData>(EMPTY_PROFILE);
  const [draftCoverVideoUrl, setDraftCoverVideoUrl] = useState<string | null>(null);
  const [draftCoverVideoBlob, setDraftCoverVideoBlob] = useState<Blob | null>(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  const setCoverVideoUrl = useCallback((target: ProfileTarget, nextUrl: string | null) => {
    setCoverVideoUrls((prev) => {
      const current = prev[target];
      if (current && current !== nextUrl && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      const next = { ...prev, [target]: nextUrl };
      coverVideoUrlsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    setProfiles(buildProfiles(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const loadVideos = async () => {
      for (const target of ['admin', 'bot'] as const) {
        try {
          const blob = await loadCoverVideoBlob(target);
          if (!blob || cancelled) continue;
          const url = URL.createObjectURL(blob);
          if (!cancelled) {
            setCoverVideoUrl(target, url);
          } else {
            URL.revokeObjectURL(url);
          }
        } catch {
          // ignore load failure
        }
      }
    };

    void loadVideos();

    return () => {
      cancelled = true;
      for (const url of Object.values(coverVideoUrlsRef.current)) {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
    };
  }, [setCoverVideoUrl]);

  const fallbackNames = useMemo(
    () => ({
      admin: 'Admin',
      bot: settings?.bot?.name?.trim() || 'Bot',
    }),
    [settings?.bot?.name],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      target: ProfileTarget;
      profile: UserProfileData;
      localVideoUrl: string | null;
      localVideoBlob: Blob | null;
    }) => {
      const clean: UserProfileData = {
        displayName: payload.profile.displayName.trim(),
        pronouns: payload.profile.pronouns.trim(),
        bio: payload.profile.bio.trim(),
        avatarUrl: payload.profile.avatarUrl.trim(),
        // video local không ghi vào settings để tránh file JSON phình to
        coverUrl: payload.localVideoUrl ? '' : payload.profile.coverUrl.trim(),
      };
      await settingsApiClient.updateSection('profiles', { [payload.target]: clean });
      return { clean, payload };
    },
    onSuccess: async ({ clean, payload }, vars) => {
      setProfiles((prev) => {
        const base = prev ?? buildProfiles(settings);
        return { ...base, [vars.target]: clean };
      });

      if (payload.localVideoUrl) {
        if (payload.localVideoBlob) {
          await saveCoverVideoBlob(vars.target, payload.localVideoBlob);
        }
        setCoverVideoUrl(vars.target, payload.localVideoUrl);
      } else {
        await deleteCoverVideoBlob(vars.target);
        setCoverVideoUrl(vars.target, null);
      }

      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Đã lưu hồ sơ ${vars.target === 'admin' ? 'Admin' : 'Bot'}`);
      setDraftCoverVideoBlob(null);
      setDraftCoverVideoUrl(null);
      setEditingTarget(null);
    },
    onError: (error: unknown) => {
      toast.error('Không lưu được hồ sơ', { description: (error as Error).message });
    },
  });

  const openEditor = (target: ProfileTarget) => {
    const source = profiles?.[target] ?? EMPTY_PROFILE;
    setEditingTarget(target);
    setDraft(normalizeProfile(source));
    setDraftCoverVideoUrl(coverVideoUrls[target]);
    setDraftCoverVideoBlob(null);
  };

  const onSelectCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const isVideo = file.type.startsWith('video/');
      if (file.size > MAX_COVER_UPLOAD_BYTES) {
        toast.error('File bìa quá lớn', {
          description: `Vui lòng chọn file nhỏ hơn ${MAX_COVER_UPLOAD_MB}MB.`,
        });
        return;
      }
      if (isVideo) {
        if (draftCoverVideoUrl && draftCoverVideoUrl.startsWith('blob:') && draftCoverVideoUrl !== (editingTarget ? coverVideoUrls[editingTarget] : null)) {
          URL.revokeObjectURL(draftCoverVideoUrl);
        }
        const localUrl = URL.createObjectURL(file);
        setDraftCoverVideoUrl(localUrl);
        setDraftCoverVideoBlob(file);
        setDraft((prev) => ({ ...prev, coverUrl: '' }));
        toast.success('Đã import video bìa');
      } else {
        const dataUrl = await toDataUrl(file);
        setDraft((prev) => ({ ...prev, coverUrl: dataUrl }));
        setDraftCoverVideoBlob(null);
        setDraftCoverVideoUrl(null);
      }
    } catch (error) {
      toast.error('Không đọc được ảnh bìa', { description: (error as Error).message });
    } finally {
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-10 w-56 rounded-xl bg-muted animate-pulse" />
        <div className="h-[420px] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý 2 hồ sơ riêng biệt: một cho tài khoản Admin, một cho tài khoản Bot.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ProfilePreview
          target="admin"
          roleLabel="Hồ sơ Admin"
          roleIcon={User}
          profile={profiles.admin}
          coverOverride={coverVideoUrls.admin}
          fallbackName={fallbackNames.admin}
          onEdit={() => openEditor('admin')}
          styleConfig={style}
        />
        <ProfilePreview
          target="bot"
          roleLabel="Hồ sơ Bot"
          roleIcon={Bot}
          profile={profiles.bot}
          coverOverride={coverVideoUrls.bot}
          fallbackName={fallbackNames.bot}
          onEdit={() => openEditor('bot')}
          styleConfig={style}
        />
      </div>

      <Dialog
        open={editingTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (
              draftCoverVideoUrl &&
              draftCoverVideoUrl.startsWith('blob:') &&
              draftCoverVideoUrl !== (editingTarget ? coverVideoUrls[editingTarget] : null)
            ) {
              URL.revokeObjectURL(draftCoverVideoUrl);
            }
            setDraftCoverVideoBlob(null);
            setDraftCoverVideoUrl(null);
            setEditingTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl border-2 bg-card">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa hồ sơ {editingTarget === 'admin' ? 'Admin' : editingTarget === 'bot' ? 'Bot' : ''}
            </DialogTitle>
            <DialogDescription>
              Giao diện popup theo phong cách Discord, lưu riêng cho từng hồ sơ.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tên hiển thị</Label>
                <Input
                  value={draft.displayName}
                  onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nhập tên hiển thị"
                  className="rounded-xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Đại từ nhân xưng</Label>
                <Input
                  value={draft.pronouns}
                  onChange={(e) => setDraft((prev) => ({ ...prev, pronouns: e.target.value }))}
                  placeholder="Ví dụ: anh/em, she/her, he/him"
                  className="rounded-xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Tiểu sử</Label>
                <Textarea
                  rows={4}
                  maxLength={300}
                  value={draft.bio}
                  onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Giới thiệu ngắn về hồ sơ này..."
                  className="rounded-xl border-2 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{draft.bio.length}/300</p>
              </div>

              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl border-2" onClick={() => setAvatarEditorOpen(true)}>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Đổi ảnh đại diện
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-2"
                    onClick={() => setDraft((prev) => ({ ...prev, avatarUrl: '' }))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa ảnh đại diện
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ảnh bìa profile</Label>
                <Input
                  value={draft.coverUrl}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, coverUrl: e.target.value }));
                    setDraftCoverVideoBlob(null);
                    setDraftCoverVideoUrl(null);
                  }}
                  placeholder="Dán URL ảnh/GIF/video hoặc chọn file từ máy"
                  className="rounded-xl border-2"
                />
                <div className="flex gap-2">
                  <label className="inline-flex">
                    <span className="inline-flex h-10 items-center rounded-xl border-2 border-border bg-background px-4 text-sm font-medium cursor-pointer hover:bg-muted">
                      <Film className="h-4 w-4 mr-2" />
                      Import ảnh/GIF/video
                    </span>
                    <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={onSelectCover} />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-2"
                    onClick={() => {
                      if (
                        draftCoverVideoUrl &&
                        draftCoverVideoUrl.startsWith('blob:') &&
                        draftCoverVideoUrl !== (editingTarget ? coverVideoUrls[editingTarget] : null)
                      ) {
                        URL.revokeObjectURL(draftCoverVideoUrl);
                      }
                      setDraft((prev) => ({ ...prev, coverUrl: '' }));
                      setDraftCoverVideoBlob(null);
                      setDraftCoverVideoUrl(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa ảnh bìa
                  </Button>
                </div>
              </div>
            </div>

            <ProfilePreview
              target={editingTarget === 'bot' ? 'bot' : 'admin'}
              roleLabel={editingTarget === 'bot' ? 'Hồ sơ Bot' : 'Hồ sơ Admin'}
              roleIcon={editingTarget === 'bot' ? Bot : User}
              profile={draft}
              coverOverride={draftCoverVideoUrl}
              fallbackName={editingTarget === 'bot' ? fallbackNames.bot : fallbackNames.admin}
              onEdit={() => {
                toast.info('Dùng cột bên trái để chỉnh nội dung. Nút 🎨 góc phải để đổi style.');
              }}
              styleConfig={style}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl border-2" onClick={() => setEditingTarget(null)}>
              Hủy
            </Button>
            <Button
              className="rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white"
              disabled={!editingTarget || saveMutation.isPending}
              onClick={() => {
                if (!editingTarget) return;
                saveMutation.mutate({
                  target: editingTarget,
                  profile: draft,
                  localVideoUrl: draftCoverVideoUrl,
                  localVideoBlob: draftCoverVideoBlob,
                });
              }}
            >
              Lưu hồ sơ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <AvatarCropDialog
          open={avatarEditorOpen}
          onOpenChange={setAvatarEditorOpen}
          onSave={(dataUrl) => setDraft((prev) => ({ ...prev, avatarUrl: dataUrl }))}
        />
      </div>

      <StyleMenu style={style} update={update} reset={reset} />
    </>
  );
}
