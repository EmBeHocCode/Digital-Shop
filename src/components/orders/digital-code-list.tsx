"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import type { GiftCardCode, ProductType } from "@/types/domain";

type DigitalCodeListProps = {
  productName: string;
  productType: ProductType;
  codes: GiftCardCode[];
};

function maskCode(value: string) {
  if (value.length <= 6) {
    return "••••••";
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function DigitalCodeList({ productName, productType, codes }: DigitalCodeListProps) {
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const label = productType === "GIFTCARD" ? "Mã gift" : "Mã thẻ";

  const toggleReveal = (codeId: string) => {
    setRevealedIds((current) =>
      current.includes(codeId) ? current.filter((entry) => entry !== codeId) : [...current, codeId]
    );
  };

  const handleCopy = async (codeId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(codeId);
      window.setTimeout(() => setCopiedId((current) => (current === codeId ? null : current)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-lg font-bold text-ink">{productName}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted">
          {codes.length} mã
        </span>
      </div>
      {codes.map((code) => {
        const isRevealed = revealedIds.includes(code.id);

        return (
          <div key={code.id} className="rounded-[22px] border border-rose-100 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-base font-semibold text-ink">
                {isRevealed ? code.code : maskCode(code.code)}
              </p>
              <StatusBadge status={code.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleReveal(code.id)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-ink"
              >
                {isRevealed ? "Ẩn mã" : "Hiện mã"}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(code.id, code.code)}
                className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-primary"
              >
                {copiedId === code.id ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
