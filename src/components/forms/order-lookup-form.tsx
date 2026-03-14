"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderLookupSchema } from "@/lib/validators";
import { apiGet } from "@/services/api-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/utils/format";

type LookupFormValues = {
  orderCode: string;
};

export function OrderLookupForm() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LookupFormValues>({
    resolver: zodResolver(orderLookupSchema)
  });

  const onSubmit = async (values: LookupFormValues) => {
    try {
      const response = await apiGet<{ order: Record<string, unknown> | null }>(
        `/orders?orderCode=${values.orderCode}`
      );
      setResult(response.order);
      setErrorMessage(response.order ? "" : "Không tìm thấy đơn hàng.");
    } catch {
      setErrorMessage("Không thể tra cứu đơn hàng.");
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-ink">Tra cứu đơn hàng</h2>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("orderCode")} placeholder="Nhập mã đơn hàng" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.orderCode ? <p className="text-sm text-rose-500">{errors.orderCode.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          Tra cứu
        </Button>
      </form>
      {errorMessage ? <p className="mt-4 text-sm text-rose-500">{errorMessage}</p> : null}
      {result ? (
        <div className="mt-6 rounded-[24px] border border-rose-100 bg-rose-50/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Mã đơn</p>
              <p className="text-xl font-bold text-ink">{String(result.orderCode)}</p>
            </div>
            <Badge label={String(result.status)} status={String(result.status)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Ngày tạo</p>
              <p className="font-semibold text-ink">{formatDate(String(result.createdAt))}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Tổng thanh toán</p>
              <p className="font-semibold text-ink">{formatCurrency(Number(result.total))}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
