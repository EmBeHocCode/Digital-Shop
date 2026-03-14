"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

type PaymentResultHeroProps = {
  status: "SUCCESS" | "FAILED";
  orderCode?: string;
  gateway?: string;
  amount?: number;
};

export function PaymentResultHero({
  status,
  orderCode,
  gateway,
  amount
}: PaymentResultHeroProps) {
  const isSuccess = status === "SUCCESS";

  return (
    <Card
      className={`max-w-4xl overflow-hidden ${
        isSuccess
          ? "bg-gradient-to-br from-[#eefaf5] via-white to-[#dff6ea]"
          : "bg-gradient-to-br from-[#fff3f3] via-white to-[#ffe6e6]"
      }`}
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-soft"
        >
          <motion.div
            animate={isSuccess ? { scale: [1, 1.08, 1] } : { rotate: [0, -6, 6, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: isSuccess ? 1.8 : 1.2 }}
            className={`text-4xl font-black ${isSuccess ? "text-emerald-500" : "text-rose-500"}`}
          >
            {isSuccess ? "✓" : "!"}
          </motion.div>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted">
            {isSuccess ? "Payment Confirmed" : "Payment Failed"}
          </p>
          <h1 className="mt-3 text-4xl font-black text-ink">
            {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">
            {isSuccess
              ? "Giao dịch đã được ghi nhận. Hệ thống sẽ chuyển sang bước giao mã số hoặc cấp phát dịch vụ ngay sau callback."
              : "Giao dịch chưa được xác nhận. Bạn có thể thử lại cổng thanh toán khác hoặc quay lại checkout để tiếp tục."}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] bg-white/80 p-4">
            <p className="text-sm text-muted">Mã đơn demo</p>
            <p className="mt-2 text-lg font-bold text-ink">{orderCode ?? "Đang tạo"}</p>
          </div>
          <div className="rounded-[24px] bg-white/80 p-4">
            <p className="text-sm text-muted">Cổng thanh toán</p>
            <p className="mt-2 text-lg font-bold text-ink">{gateway ?? "Chưa xác định"}</p>
          </div>
          <div className="rounded-[24px] bg-white/80 p-4">
            <p className="text-sm text-muted">Số tiền</p>
            <p className="mt-2 text-lg font-bold text-ink">
              {typeof amount === "number" ? formatCurrency(amount) : "N/A"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isSuccess ? (
            <>
              <Button href="/profile/orders">Xem đơn hàng</Button>
              <Button href="/products" variant="outline">
                Tiếp tục mua sắm
              </Button>
            </>
          ) : (
            <>
              <Button href="/checkout">Quay lại thanh toán</Button>
              <Button href="/support" variant="outline">
                Liên hệ hỗ trợ
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
