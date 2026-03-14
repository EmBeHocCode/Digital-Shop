'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApiClient, type Memory } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Brain, Search, Trash2, User, Star, Calendar, ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';

type MemoryForm = {
  content: string;
  userId: string;
  userName: string;
  importance: number;
};

const emptyForm = (): MemoryForm => ({ content: '', userId: '', userName: '', importance: 5 });

function MemoryDialog({
  open,
  onClose,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Memory | null;
  onSave: (form: MemoryForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MemoryForm>(() =>
    initial
      ? { content: initial.content, userId: initial.userId ?? '', userName: initial.userName ?? '', importance: initial.importance ?? 5 }
      : emptyForm(),
  );

  // Reset khi dialog mở với dữ liệu mới
  const handleOpen = () => {
    setForm(
      initial
        ? { content: initial.content, userId: initial.userId ?? '', userName: initial.userName ?? '', importance: initial.importance ?? 5 }
        : emptyForm(),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg rounded-2xl border-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#CE82FF]" />
            {initial ? 'Chỉnh sửa bộ nhớ' : 'Thêm bộ nhớ mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Content */}
          <div className="space-y-2">
            <Label className="font-semibold">Nội dung <span className="text-red-400">*</span></Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Nhập nội dung bộ nhớ..."
              className="min-h-[120px] rounded-xl border-2 resize-none text-sm"
              autoFocus
            />
          </div>

          {/* User row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-semibold">Tên người dùng</Label>
              <Input
                value={form.userName}
                onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                placeholder="VD: Nguyễn Văn A"
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">User ID</Label>
              <Input
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="VD: 123456789"
                className="rounded-xl border-2"
              />
            </div>
          </div>

          {/* Importance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Độ quan trọng</Label>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF9600]/10 text-[#FF9600] text-sm font-bold">
                <Star className="h-3.5 w-3.5" />
                {form.importance}/10
              </span>
            </div>
            <Slider
              value={[form.importance]}
              onValueChange={([v]) => setForm((f) => ({ ...f, importance: v }))}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ít quan trọng</span>
              <span>Rất quan trọng</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-2 font-semibold" disabled={saving}>
            Hủy
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.content.trim() || saving}
            className="rounded-xl font-semibold bg-[#CE82FF] hover:bg-[#BE6FEF] text-white shadow-[0_4px_0_0_#B86EE6] hover:shadow-[0_2px_0_0_#B86EE6] hover:translate-y-[2px] transition-all"
          >
            {saving ? 'Đang lưu...' : initial ? 'Lưu thay đổi' : 'Thêm bộ nhớ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MemoriesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['memories', page, search],
    queryFn: async () => {
      const res = await memoriesApiClient.list({ page, limit: 20, search: search || undefined });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: MemoryForm) =>
      memoriesApiClient.create({
        content: form.content,
        userId: form.userId || undefined,
        userName: form.userName || undefined,
        importance: form.importance,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Đã thêm bộ nhớ');
      setDialogOpen(false);
    },
    onError: () => toast.error('Lỗi khi thêm bộ nhớ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: MemoryForm }) =>
      memoriesApiClient.update(id, {
        content: form.content,
        userId: form.userId || undefined,
        userName: form.userName || undefined,
        importance: form.importance,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Đã cập nhật bộ nhớ');
      setEditTarget(null);
    },
    onError: () => toast.error('Lỗi khi cập nhật bộ nhớ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => memoriesApiClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Đã xóa bộ nhớ');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Lỗi khi xóa bộ nhớ'),
  });

  const handleSave = (form: MemoryForm) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#CE82FF] text-white shadow-[0_4px_0_0_#B86EE6]">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bộ nhớ</h1>
            <p className="text-muted-foreground font-medium">Bộ nhớ chung chia sẻ giữa tất cả AI</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setDialogOpen(true); }}
          className="h-11 px-5 rounded-xl font-semibold bg-[#CE82FF] hover:bg-[#BE6FEF] text-white shadow-[0_4px_0_0_#B86EE6] hover:shadow-[0_2px_0_0_#B86EE6] hover:translate-y-[2px] transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm bộ nhớ
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm bộ nhớ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-12 h-12 rounded-xl border-2 text-base font-medium focus:border-[#CE82FF] focus:ring-[#CE82FF]/20"
        />
      </div>

      {/* Memory Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-border bg-card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 w-16 bg-muted rounded-lg" />
                <div className="h-8 w-16 bg-muted rounded-lg" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-muted rounded-lg" />
                <div className="h-4 w-3/4 bg-muted rounded-lg" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 bg-muted rounded-lg" />
                <div className="h-4 w-24 bg-muted rounded-lg" />
              </div>
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#CE82FF]/10 mb-4">
              <Brain className="h-8 w-8 text-[#CE82FF]" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">Không có bộ nhớ nào</p>
            <p className="text-sm text-muted-foreground mt-1">Bot sẽ lưu trữ thông tin quan trọng ở đây</p>
          </div>
        ) : (
          data?.data?.map((memory, index) => (
            <div
              key={memory.id}
              className="group rounded-2xl border-2 border-border bg-card p-5 hover:border-[#CE82FF]/50 hover:shadow-lg transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#CE82FF]/10 text-xs font-bold text-[#CE82FF]">
                  #{memory.id}
                </span>
                {/* Action buttons - hiện khi hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditTarget(memory); setDialogOpen(true); }}
                    className="h-8 w-8 rounded-lg hover:bg-[#CE82FF]/10 hover:text-[#CE82FF]"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(memory)}
                    className="h-8 w-8 rounded-lg hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B]"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm font-medium leading-relaxed mb-4 line-clamp-3" title={memory.content}>
                {memory.content}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(memory.userName || memory.userId) && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted font-medium">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {memory.userName || memory.userId}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FF9600]/10 text-[#FF9600] font-semibold">
                  <Star className="h-3 w-3" />
                  {memory.importance}/10
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(memory.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground font-medium">
            Trang {data.pagination.page} / {data.pagination.totalPages}
            <span className="text-muted-foreground/60 ml-2">({data.pagination.total} memories)</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-4 rounded-xl border-2 font-semibold hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.pagination.totalPages}
              className="h-10 px-4 rounded-xl border-2 font-semibold hover:bg-muted"
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <MemoryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        initial={editTarget}
        onSave={handleSave}
        saving={isSaving}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bộ nhớ #{deleteTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription className="line-clamp-2">
              {deleteTarget?.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-2 font-semibold">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="rounded-xl font-semibold bg-[#FF4B4B] hover:bg-[#E03E3E] text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}