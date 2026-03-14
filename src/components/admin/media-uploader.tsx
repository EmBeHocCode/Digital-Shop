"use client";

export function MediaUploader() {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-primary/40 bg-rose-50/70 px-6 py-10 text-center transition hover:border-primary hover:bg-rose-50">
      <span className="text-lg font-bold text-ink">Tải ảnh lên thư viện media</span>
      <span className="mt-2 text-sm text-muted">
        Hỗ trợ logo, banner, ảnh sản phẩm, icon danh mục, avatar và icon thanh toán.
      </span>
      <input type="file" className="hidden" />
    </label>
  );
}
