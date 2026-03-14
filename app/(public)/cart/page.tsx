import type { Metadata } from "next"
import { CartPageContent } from "@/features/cart/components/cart-page-content"

export const metadata: Metadata = {
  title: "Giỏ hàng | NexCloud",
  description: "Xem lại dịch vụ đã chọn trước khi tiếp tục sang checkout.",
}

export default function CartPage() {
  return <CartPageContent />
}
