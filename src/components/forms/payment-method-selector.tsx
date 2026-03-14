"use client";

import { paymentMethods } from "@/services/payment-service";
import { cn } from "@/utils/cn";

export function PaymentMethodSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {paymentMethods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onChange(method.id)}
          className={cn(
            "rounded-[24px] border p-4 text-left transition",
            value === method.id
              ? "border-primary bg-rose-50"
              : "border-rose-100 bg-white hover:border-primary"
          )}
        >
          <p className="font-semibold text-ink">{method.name}</p>
          <p className="mt-1 text-sm text-muted">{method.description}</p>
        </button>
      ))}
    </div>
  );
}
