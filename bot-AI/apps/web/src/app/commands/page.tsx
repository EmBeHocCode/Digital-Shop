'use client';

import { useEffect, useMemo, useState } from 'react'; // useEffect used for debounce
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  commandsApiClient,
  envApiClient,
  type CommandItem,
  type ApiKeyHealthItem,
} from '@/lib/api';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  BookText,
  Copy,
  Search,
  Terminal,
  Wrench,
  Pencil,
  Lock,
  Users,
  PowerOff,
  Power,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';

// --- helpers ---

function buildCommandSyntax(cmd: CommandItem): string {
  if (!cmd.parameters || cmd.parameters.length === 0) return `!${cmd.name}`;
  const args = cmd.parameters
    .map((p) => (p.required ? `<${p.name}>` : `[${p.name}]`))
    .join(' ');
  return `!${cmd.name} ${args}`.trim();
}

function sampleArg(type: CommandItem['parameters'][number]['type']): string {
  switch (type) {
    case 'number': return '1';
    case 'boolean': return 'true';
    case 'object': return '{"key":"value"}';
    default: return 'text';
  }
}

function buildCommandExample(cmd: CommandItem): string {
  if (cmd.example) return cmd.example;
  if (!cmd.parameters || cmd.parameters.length === 0) return `!${cmd.name}`;
  const args = cmd.parameters
    .map((p) => (p.required ? sampleArg(p.type) : `[${sampleArg(p.type)}]`))
    .join(' ');
  return `!${cmd.name} ${args}`.trim();
}

function truncate(text: string, max = 88): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}...`;
}

function getKeyBadgeInfo(status: ApiKeyHealthItem['status'] | undefined) {
  switch (status) {
    case 'valid':   return null;
    case 'missing': return { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30', text: '! Chua co API Key' };
    case 'invalid': return { cls: 'bg-red-500/10 text-red-400 border-red-400/30', text: 'x Key khong hop le' };
    case 'error':   return { cls: 'bg-orange-500/10 text-orange-400 border-orange-400/30', text: '! Loi xac thuc' };
    default:        return { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30', text: '! Chua xac thuc' };
  }
}

// --- Edit dialog ---

interface EditDialogProps {
  cmd: CommandItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditDialog({ cmd, onClose, onSaved }: EditDialogProps) {
  const [role, setRole] = useState<'everyone' | 'admin'>(cmd?.role ?? 'everyone');
  const [enabled, setEnabled] = useState(!cmd?.disabled);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const roleMutation = useMutation({
    mutationFn: ({ name, role }: { name: string; role: 'everyone' | 'admin' }) =>
      commandsApiClient.setRole(name, role),
  });
  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      commandsApiClient.toggle(name, enabled),
  });

  const handleSave = async () => {
    if (!cmd) return;
    try {
      const tasks: Promise<unknown>[] = [];
      if (role !== (cmd.role ?? 'everyone')) {
        tasks.push(roleMutation.mutateAsync({ name: cmd.name, role }));
      }
      if (enabled !== !cmd.disabled) {
        if (!enabled) {
          setConfirmDisable(true);
          return;
        }
        tasks.push(toggleMutation.mutateAsync({ name: cmd.name, enabled: true }));
      }
      await Promise.all(tasks);
      toast.success(`Da cap nhat !${cmd.name}`);
      onSaved();
      onClose();
    } catch {
      toast.error('Loi khi luu thay doi');
    }
  };

  const handleConfirmDisable = async () => {
    if (!cmd) return;
    try {
      const tasks: Promise<unknown>[] = [toggleMutation.mutateAsync({ name: cmd.name, enabled: false })];
      if (role !== (cmd.role ?? 'everyone')) {
        tasks.push(roleMutation.mutateAsync({ name: cmd.name, role }));
      }
      await Promise.all(tasks);
      toast.success(`Da tat lenh !${cmd.name}`);
      setConfirmDisable(false);
      onSaved();
      onClose();
    } catch {
      toast.error('Loi khi tat lenh');
    }
  };

  const isSaving = roleMutation.isPending || toggleMutation.isPending;
  const hasChanges = cmd && (role !== (cmd.role ?? 'everyone') || enabled !== !cmd.disabled);

  if (!cmd) return null;

  return (
    <>
      <Dialog open={!!cmd} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md rounded-2xl border-2 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#1CB0F6]" />
              Chinh sua !{cmd.name}
            </DialogTitle>
            <DialogDescription>
              Thay doi quyen truy cap va trang thai kich hoat cua lenh nay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Quyen su dung
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('everyone')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    role === 'everyone'
                      ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                      : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Tat ca</p>
                    <p className="text-[10px] opacity-70">Moi nguoi dung</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    role === 'admin'
                      ? 'border-red-400 bg-red-400/10 text-red-400'
                      : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Admin only</p>
                    <p className="text-[10px] opacity-70">Chi admin su dung</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border-2 border-border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                {enabled ? (
                  <Power className="h-4 w-4 text-[#58CC02]" />
                ) : (
                  <PowerOff className="h-4 w-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {enabled ? 'Lenh dang hoat dong' : 'Lenh da bi tat'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {enabled
                      ? 'Tat de vo hieu hoa hoan toan lenh nay'
                      : 'Bat de kich hoat lai lenh'}
                  </p>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="data-[state=checked]:bg-[#58CC02]"
              />
            </div>

            <div className="rounded-xl border border-border/50 p-3 bg-muted/10 space-y-1.5 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Module:</span> {cmd.moduleLabel}</p>
              {cmd.requiresApiKey && (
                <p><span className="font-medium text-foreground">Yeu cau API Key:</span> {cmd.requiresApiKey}</p>
              )}
              <p><span className="font-medium text-foreground">Loai:</span> {cmd.builtIn ? 'Built-in' : 'Tool command'}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="rounded-xl flex-1 bg-[#1CB0F6] hover:bg-[#1899D6]"
            >
              {isSaving ? 'Dang luu...' : 'Luu thay doi'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-2"
            >
              Huy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <AlertDialogContent className="rounded-2xl border-2 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Tat lenh !{cmd.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Lenh nay se bi vo hieu hoa hoan toan - khong ai co the su dung, ke ca admin.
              Ban co the bat lai bat cu luc nao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-2">Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDisable}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              <PowerOff className="h-3.5 w-3.5 mr-1.5" />
              Tat lenh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Detail dialog ---

interface DetailDialogProps {
  cmd: CommandItem | null;
  healthMap: Map<string, ApiKeyHealthItem>;
  onClose: () => void;
  onEdit: (cmd: CommandItem) => void;
}

function DetailDialog({ cmd, healthMap, onClose, onEdit }: DetailDialogProps) {
  const copyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Khong the copy');
    }
  };

  if (!cmd) return null;

  return (
    <Dialog open={!!cmd} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl border-2 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#1CB0F6]" />
            !{cmd.name}
            {cmd.disabled && (
              <Badge className="bg-red-500/10 text-red-400 border-red-400/30 text-[10px]">Da tat</Badge>
            )}
            {cmd.role === 'admin' && (
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/30 text-[10px]">
                <Lock className="h-2.5 w-2.5 mr-1" />Admin only
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{cmd.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Cu phap</p>
            <p className="font-mono">{buildCommandSyntax(cmd)}</p>
          </div>

          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Vi du</p>
            <p className="font-mono">{buildCommandExample(cmd)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{cmd.moduleLabel}</Badge>
            <Badge variant="outline">Params: {cmd.parameterCount}</Badge>
            {cmd.aliases.length > 0 && (
              <Badge variant="outline">Alias: {cmd.aliases.length}</Badge>
            )}
            {cmd.role === 'admin' ? (
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/30">
                <Lock className="h-3 w-3 mr-1" />Admin only
              </Badge>
            ) : (
              <Badge className="bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30">
                <Users className="h-3 w-3 mr-1" />Tat ca
              </Badge>
            )}
            {cmd.disabled && (
              <Badge className="bg-red-500/10 text-red-400 border-red-400/30">Da tat</Badge>
            )}
            {cmd.requiresApiKey && (() => {
              const keyName = cmd.requiresApiKey!;
              const h = healthMap.get(keyName);
              const status = h?.status ?? 'missing';
              if (status === 'valid') return (
                <Badge key="valid" className="bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30">ok {keyName}</Badge>
              );
              if (status === 'missing') return (
                <Badge key="missing" className="bg-amber-500/10 text-amber-500 border-amber-500/30">! Chua cai: {keyName}</Badge>
              );
              if (status === 'invalid') return (
                <Badge key="invalid" className="bg-red-500/10 text-red-400 border-red-400/30">x Key khong hop le</Badge>
              );
              return (
                <Badge key="error" className="bg-orange-500/10 text-orange-400 border-orange-400/30">! {h?.message ?? `Loi xac thuc: ${keyName}`}</Badge>
              );
            })()}
          </div>

          {cmd.aliases.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Alias</p>
              <div className="flex flex-wrap gap-2">
                {cmd.aliases.map((alias) => (
                  <Badge key={alias} variant="outline">!{alias}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tham so</p>
            {cmd.parameters.length === 0 ? (
              <p className="text-muted-foreground">Lenh nay khong can tham so.</p>
            ) : (
              <div className="space-y-2">
                {cmd.parameters.map((p) => (
                  <div key={p.name} className="rounded-lg border border-border p-2">
                    <p className="font-mono text-xs">{p.name} ({p.type}, {p.required ? 'bat buoc' : 'tuy chon'})</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => copyText(buildCommandSyntax(cmd), `Da copy cu phap !${cmd.name}`)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />Copy cu phap
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-2"
              onClick={() => copyText(buildCommandExample(cmd), `Da copy vi du !${cmd.name}`)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />Copy vi du
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-2 ml-auto"
              onClick={() => { onClose(); onEdit(cmd); }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />Chinh sua
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Command card ---

interface CommandCardProps {
  cmd: CommandItem;
  healthMap: Map<string, ApiKeyHealthItem>;
  onDetail: (cmd: CommandItem) => void;
  onEdit: (cmd: CommandItem) => void;
  onToggle: (cmd: CommandItem) => void;
}

function CommandCard({ cmd, healthMap, onDetail, onEdit, onToggle }: CommandCardProps) {
  const isDisabled = cmd.disabled;
  const isAdmin = cmd.role === 'admin';

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all cursor-pointer ${
        isDisabled
          ? 'border-border/40 bg-card/50 opacity-60'
          : 'border-border bg-card hover:border-[#1CB0F6]/50'
      }`}
      onClick={() => onDetail(cmd)}
    >
      {isDisabled && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-red-500/15 text-red-400 border-red-400/30 text-[10px]">
            <PowerOff className="h-2.5 w-2.5 mr-1" />Da tat
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#1CB0F6] shrink-0" />
            <span className="truncate">!{cmd.name}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{truncate(cmd.description, 90)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            className={cmd.builtIn ? 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30' : ''}
            onClick={(e) => e.stopPropagation()}
          >
            {cmd.builtIn ? 'built-in' : cmd.moduleLabel}
          </Badge>
          {isAdmin && !isDisabled && (
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-400/30 text-[10px]">
              <Lock className="h-2.5 w-2.5 mr-1" />Admin
            </Badge>
          )}
          {cmd.requiresApiKey && (() => {
            const h = healthMap.get(cmd.requiresApiKey!);
            const info = getKeyBadgeInfo(h?.status);
            if (!info) return null;
            return <Badge className={`${info.cls} text-[10px]`}>{info.text}</Badge>;
          })()}
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-border/70 bg-muted/20 p-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Cu phap</p>
        <p className="font-mono text-xs text-foreground truncate">{buildCommandSyntax(cmd)}</p>
      </div>

      {cmd.aliases.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Alias</p>
          <div className="flex flex-wrap gap-1">
            {cmd.aliases.slice(0, 3).map((alias) => (
              <Badge key={alias} variant="outline" className="text-xs">!{alias}</Badge>
            ))}
            {cmd.aliases.length > 3 && (
              <Badge variant="outline" className="text-xs">+{cmd.aliases.length - 3}</Badge>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
          <Wrench className="h-3 w-3" />Params ({cmd.parameterCount})
        </p>
        {cmd.parameters.length === 0 ? (
          <p className="text-xs text-muted-foreground">Khong co tham so</p>
        ) : (
          <div className="space-y-1">
            {cmd.parameters.slice(0, 3).map((p) => (
              <p key={p.name} className="text-xs">
                <span className="font-mono">{p.name}</span>{' '}
                <span className="text-muted-foreground">({p.type}{p.required ? ', bat buoc' : ''})</span>
              </p>
            ))}
            {cmd.parameters.length > 3 && (
              <p className="text-xs text-muted-foreground">+{cmd.parameters.length - 3} tham so khac</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-2 flex-1"
          onClick={() => onDetail(cmd)}
        >
          Chi tiet
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-2 px-2.5"
          title="Chinh sua quyen & role"
          onClick={() => onEdit(cmd)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`rounded-lg px-2.5 ${
            isDisabled
              ? 'text-[#58CC02] hover:bg-[#58CC02]/10'
              : 'text-red-400 hover:bg-red-400/10'
          }`}
          title={isDisabled ? 'Bat lenh' : 'Tat lenh'}
          onClick={() => onToggle(cmd)}
        >
          {isDisabled ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// --- Page ---

export default function CommandsPage() {
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [detailCmd, setDetailCmd] = useState<CommandItem | null>(null);
  const [editCmd, setEditCmd] = useState<CommandItem | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<CommandItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(qInput), 250);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['commands', q, moduleFilter],
    queryFn: async () => {
      const res = await commandsApiClient.list({
        q: q.trim() || undefined,
        module: moduleFilter === 'all' ? undefined : moduleFilter,
      });
      if (res.data?.botOffline) return null;
      return res.data.data ?? null;
    },
    retry: false,
    staleTime: 1000 * 30,
  });

  const { data: healthData } = useQuery({
    queryKey: ['api-key-health'],
    queryFn: async () => {
      const res = await envApiClient.validate();
      return res.data?.data?.results ?? null;
    },
    staleTime: 1000 * 60 * 4,
    refetchInterval: 1000 * 60 * 5,
  });

  const healthMap = useMemo(() => {
    const m = new Map<string, ApiKeyHealthItem>();
    if (healthData) for (const item of healthData) m.set(item.key, item);
    return m;
  }, [healthData]);

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      commandsApiClient.toggle(name, enabled),
    onSuccess: (_, vars) => {
      toast.success(vars.enabled ? `Da bat lenh !${vars.name}` : `Da tat lenh !${vars.name}`);
      queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
    onError: () => toast.error('Loi khi thay doi trang thai lenh'),
  });

  const commands = useMemo(() => {
    if (!data) return [];
    return [...data.builtIn, ...data.tools].sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1;
      if (a.moduleLabel !== b.moduleLabel) return a.moduleLabel.localeCompare(b.moduleLabel);
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const modules = useMemo(() => {
    if (!data) return [];
    const source = (q || moduleFilter !== 'all') ? data.filteredByModule : data.byModule;
    return (source ?? data.byModule).map((m) => ({ value: m.module, label: m.moduleLabel, count: m.count }));
  }, [data, q, moduleFilter]);

  const visibleCommands = commands.slice(0, visibleCount);
  const hasMore = visibleCount < commands.length;

  const handleToggle = (cmd: CommandItem) => {
    if (!cmd.disabled) {
      setConfirmToggle(cmd);
    } else {
      toggleMutation.mutate({ name: cmd.name, enabled: true });
    }
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['commands'] });
  };

  const disabledCount = commands.filter((c) => c.disabled).length;
  const adminOnlyCount = commands.filter((c) => c.role === 'admin').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1CB0F6] text-white shadow-[0_4px_0_0_#1899D6]">
            <BookText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lenh Bot</h1>
            <p className="text-muted-foreground font-medium">
              Quan ly lenh: phan quyen, kich hoat/tat tung lenh
            </p>
          </div>
        </div>
      </div>

      {!isLoading && data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tong lenh</p>
            <p className="text-2xl font-bold mt-1">{data.originalTotal ?? data.total}</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {(q || moduleFilter !== 'all') ? 'Ket qua loc' : 'Lenh nhanh'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {(q || moduleFilter !== 'all') ? data.total : data.builtIn.length}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin only</p>
              <p className="text-2xl font-bold mt-1 text-purple-400">{adminOnlyCount}</p>
            </div>
            <Lock className="h-6 w-6 text-purple-400/50" />
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Da tat</p>
              <p className="text-2xl font-bold mt-1 text-red-400">{disabledCount}</p>
            </div>
            <PowerOff className="h-6 w-6 text-red-400/50" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => { setQInput(e.target.value); setVisibleCount(24); }}
            placeholder="Tim theo ten lenh, mo ta, alias..."
            className="pl-9 h-11 rounded-xl border-2"
          />
        </div>
        <Select
          value={moduleFilter}
          onValueChange={(value) => { setModuleFilter(value); setVisibleCount(24); }}
        >
          <SelectTrigger className="w-full md:w-72 h-11 rounded-xl border-2">
            <SelectValue placeholder="Loc theo module" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="all">Tat ca module</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label} ({m.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && data && (
        <div className="rounded-2xl border-2 border-border bg-card p-3 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
          <span>
            Hien thi <span className="font-semibold text-foreground">{visibleCommands.length}</span>/{commands.length} lenh
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <Pencil className="h-3 w-3" />
            Bam nut chinh sua de thay doi quyen & trang thai
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <Lock className="h-3 w-3 text-purple-400" />
            <span className="text-purple-400">Admin only</span>
            <span className="mx-1">·</span>
            <ShieldOff className="h-3 w-3 text-red-400" />
            <span className="text-red-400">Da tat</span>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 animate-pulse">
              <div className="h-5 w-1/2 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : data === null ? (
        <div className="rounded-2xl border-2 border-muted bg-muted/20 p-6 text-muted-foreground">
          Bot dang offline, khong the tai danh sach lenh.
        </div>
      ) : commands.length === 0 ? (
        <div className="rounded-2xl border-2 border-border bg-card p-6 text-muted-foreground">
          Khong co lenh nao khop bo loc hien tai.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCommands.map((cmd) => (
            <CommandCard
              key={`${cmd.module}:${cmd.name}`}
              cmd={cmd}
              healthMap={healthMap}
              onDetail={setDetailCmd}
              onEdit={setEditCmd}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-xl border-2"
            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, commands.length))}
          >
            Xem them ({commands.length - visibleCount} lenh)
          </Button>
        </div>
      )}

      <DetailDialog
        cmd={detailCmd}
        healthMap={healthMap}
        onClose={() => setDetailCmd(null)}
        onEdit={(cmd) => setEditCmd(cmd)}
      />

      <EditDialog
        key={editCmd?.name ?? 'none'}
        cmd={editCmd}
        onClose={() => setEditCmd(null)}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <AlertDialogContent className="rounded-2xl border-2 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Tat lenh !{confirmToggle?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Lenh nay se bi vo hieu hoa hoan toan - khong ai su dung duoc, ke ca admin.
              Ban co the bat lai bat cu luc nao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-2">Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmToggle) {
                  toggleMutation.mutate({ name: confirmToggle.name, enabled: false });
                  setConfirmToggle(null);
                }
              }}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              <PowerOff className="h-3.5 w-3.5 mr-1.5" />
              Tat lenh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
