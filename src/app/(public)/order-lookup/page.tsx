import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/forms/order-lookup-form";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng | MeowMarket",
  description: "Nhập mã đơn hàng và xem trạng thái giao dịch."
};

export default function OrderLookupRoute() {
  return (
    <div className="max-w-3xl">
      <OrderLookupForm />
    </div>
  );
}
