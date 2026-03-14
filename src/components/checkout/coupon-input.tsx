"use client";

export function CouponInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập mã giảm giá"
        className="w-full rounded-2xl border border-border px-4 py-3 outline-none"
      />
      <button
        type="button"
        className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        Áp dụng
      </button>
    </div>
  );
}
