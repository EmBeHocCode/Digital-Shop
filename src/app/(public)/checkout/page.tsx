import type { Metadata } from "next";
import { CheckoutPage } from "@/modules/checkout/checkout-page";

export const metadata: Metadata = {
  title: "Thanh toán | MeowMarket",
  description: "Thông tin khách, phương thức thanh toán và tóm tắt đơn hàng."
};

export default function CheckoutRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-ink">Thanh toán</h1>
        <p className="mt-3 text-sm text-muted">Giao diện thanh toán tạo cảm giác tin cậy và dễ kiểm soát.</p>
      </div>
      <CheckoutPage />
    </div>
  );
}
