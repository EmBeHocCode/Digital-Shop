"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { checkoutSchema } from "@/lib/validators";
import type { CheckoutFormValues } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaymentMethodSelector } from "@/components/forms/payment-method-selector";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

type CheckoutFormProps = {
  total: number;
};

type DemoPaymentResult = "SUCCESS" | "FAILED";

export function CheckoutForm({ total }: CheckoutFormProps) {
  const router = useRouter();
  const [paymentScenario, setPaymentScenario] = useState<DemoPaymentResult>("SUCCESS");
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "VNPAY"
    }
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    const orderCode = `MM${Date.now().toString().slice(-6)}`;
    setProcessingLabel("Đang khởi tạo giao dịch...");

    try {
      const intentResponse = await fetch("/api/payments/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderCode,
          gateway: values.paymentMethod,
          amount: total
        })
      });

      const intentPayload = await intentResponse.json();
      const transactionCode = intentPayload.intent?.transactionCode as string | undefined;

      setProcessingLabel(`Đang chờ phản hồi từ ${values.paymentMethod}...`);

      await new Promise((resolve) => window.setTimeout(resolve, 1600));

      if (!transactionCode) {
        router.push("/checkout/failure?reason=intent");
        return;
      }

      await fetch("/api/payments/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transactionCode,
          status: paymentScenario,
          orderCode
        })
      });

      const destination =
        paymentScenario === "SUCCESS"
          ? `/checkout/success?orderCode=${orderCode}&gateway=${values.paymentMethod}&amount=${total}`
          : `/checkout/failure?orderCode=${orderCode}&gateway=${values.paymentMethod}&amount=${total}`;

      router.push(destination);
    } catch {
      router.push("/checkout/failure?reason=network");
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-ink">Thông tin thanh toán</h2>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("fullName")} placeholder="Họ và tên" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.fullName ? <p className="text-sm text-rose-500">{errors.fullName.message}</p> : null}
        <input {...register("email")} placeholder="Email" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.email ? <p className="text-sm text-rose-500">{errors.email.message}</p> : null}
        <input {...register("phone")} placeholder="Số điện thoại" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.phone ? <p className="text-sm text-rose-500">{errors.phone.message}</p> : null}
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <PaymentMethodSelector value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.paymentMethod ? <p className="text-sm text-rose-500">{errors.paymentMethod.message}</p> : null}
        <div className="rounded-[24px] border border-dashed border-rose-200 bg-rose-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Kịch bản demo</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Chọn nhanh trạng thái callback để xem hiệu ứng thanh toán thành công hoặc thất bại.
              </p>
            </div>
            <div className="flex rounded-full bg-white p-1 shadow-soft">
              {(["SUCCESS", "FAILED"] as DemoPaymentResult[]).map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => setPaymentScenario(scenario)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    paymentScenario === scenario
                      ? scenario === "SUCCESS"
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                      : "text-muted"
                  )}
                >
                  {scenario === "SUCCESS" ? "Thành công" : "Thất bại"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <textarea {...register("note")} rows={4} placeholder="Ghi chú đơn hàng" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        <Button type="submit" disabled={isSubmitting}>
          Xác nhận thanh toán {formatCurrency(total)}
        </Button>

        <AnimatePresence>
          {processingLabel ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[24px] border border-rose-100 bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "linear" }}
                  className="h-10 w-10 rounded-full border-2 border-rose-200 border-t-primary"
                />
                <div>
                  <p className="font-semibold text-ink">Đang xử lý thanh toán</p>
                  <p className="mt-1 text-sm text-muted">{processingLabel}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </Card>
  );
}
