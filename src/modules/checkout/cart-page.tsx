"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/hooks/use-cart-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderSummary } from "@/components/forms/order-summary";
import { calculateOrderTotals } from "@/utils/order-totals";
import { formatCurrency } from "@/utils/format";

export function CartPage() {
  const { items, couponCode, updateQuantity, removeItem, setCouponCode } = useCartStore();
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(
    () => calculateOrderTotals(items.map((item) => ({ price: item.price, quantity: item.quantity }))).subtotal,
    [items]
  );

  useEffect(() => {
    let mounted = true;

    fetch("/api/coupons/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: couponCode,
        subtotal
      })
    })
      .then((response) => response.json())
      .then((payload) => {
        if (mounted) {
          setDiscount(Number(payload.discount ?? 0));
        }
      })
      .catch(() => {
        if (mounted) {
          setDiscount(0);
        }
      });

    return () => {
      mounted = false;
    };
  }, [couponCode, subtotal]);

  const totals = useMemo(
    () => calculateOrderTotals(items.map((item) => ({ price: item.price, quantity: item.quantity })), discount),
    [discount, items]
  );

  if (!items.length) {
    return (
      <EmptyState
        title="Giỏ hàng đang trống"
        description="Thêm vài dịch vụ số để bắt đầu đơn hàng mới."
        ctaLabel="Khám phá sản phẩm"
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold text-ink">{item.name}</p>
              <p className="mt-1 text-sm text-muted">{item.type}</p>
              {item.configurationLabel ? (
                <p className="mt-2 text-sm font-medium text-ink">{item.configurationLabel}</p>
              ) : null}
              {item.configurationSummary ? (
                <p className="mt-1 text-sm text-muted">{item.configurationSummary}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                className="w-20 rounded-2xl border border-rose-100 px-3 py-2 outline-none"
              />
              <p className="w-32 text-right font-semibold text-ink">
                {formatCurrency(item.price * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-primary"
              >
                Xóa
              </button>
            </div>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Card>
          <h3 className="text-xl font-bold text-ink">Mã giảm giá</h3>
          <div className="mt-4 flex gap-3">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Nhập mã giảm giá"
              className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
            />
          </div>
        </Card>
        <OrderSummary
          subtotal={totals.subtotal}
          discount={totals.discount}
          total={totals.total}
        />
        <Button href="/checkout" className="w-full">
          Tiến hành thanh toán
        </Button>
      </div>
    </div>
  );
}
