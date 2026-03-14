"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/hooks/use-cart-store";
import { CheckoutForm } from "../../components/forms/checkout-form";
import { OrderSummary } from "../../components/forms/order-summary";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateOrderTotals } from "@/utils/order-totals";

export function CheckoutPage() {
  const { items, couponCode } = useCartStore();
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
        title="Chưa có sản phẩm để thanh toán"
        description="Thêm dịch vụ vào giỏ hàng trước khi chuyển sang bước thanh toán."
        ctaLabel="Xem danh sách sản phẩm"
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <CheckoutForm total={totals.total} />
      <div className="space-y-4">
        <OrderSummary
          subtotal={totals.subtotal}
          discount={totals.discount}
          total={totals.total}
        />
        <Card>
          <h3 className="text-xl font-bold text-ink">Trạng thái</h3>
          <p className="mt-4 text-sm leading-7 text-muted">
            Luồng checkout đã có mô phỏng xử lý, callback thành công hoặc thất bại để bạn hoàn thiện trải nghiệm thanh toán trước khi nối gateway thật.
          </p>
        </Card>
      </div>
    </div>
  );
}
