import type { Metadata } from "next"
import { OrderSuccessPageContent } from "@/features/cart/components/order-success-page-content"
import { getUserOrderById } from "@/features/orders/services/get-user-orders"
import { getAuthSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Đặt hàng thành công | NexCloud",
  description: "Trạng thái xác nhận thành công cho flow checkout của NexCloud.",
}

interface OrderSuccessPageProps {
  searchParams: Promise<{
    orderId?: string
  }>
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const resolvedSearchParams = await searchParams
  const session = await getAuthSession()
  const orderId = resolvedSearchParams.orderId
  const order =
    session?.user?.id && orderId
      ? await getUserOrderById(session.user.id, orderId)
      : null

  return <OrderSuccessPageContent order={order} />
}
