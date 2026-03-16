import { Suspense } from "react"
import type { Metadata } from "next"
import { CheckoutPageContent } from "@/features/cart/components/checkout-page-content"

export const metadata: Metadata = {
  title: "Checkout | NexCloud",
  description: "Hoàn tất thông tin đơn hàng cho cart hiện tại của bạn.",
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  )
}
