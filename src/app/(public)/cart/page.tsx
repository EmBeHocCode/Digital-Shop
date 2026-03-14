import type { Metadata } from "next";
import { CartPage } from "@/modules/checkout/cart-page";

export const metadata: Metadata = {
  title: "Giỏ hàng | MeowMarket",
  description: "Danh sách sản phẩm, số lượng, tổng tiền và mã giảm giá."
};

export default function CartRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-ink">Giỏ hàng</h1>
        <p className="mt-3 text-sm text-muted">Luồng mua hàng rõ ràng với tổng tiền và coupon.</p>
      </div>
      <CartPage />
    </div>
  );
}
