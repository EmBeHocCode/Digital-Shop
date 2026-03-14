import { OrderDetailPage } from "@/modules/orders/order-detail-page";

export default async function ProfileOrderDetailRoute({
  params
}: {
  params: { orderCode: string };
}) {
  return <OrderDetailPage orderCode={params.orderCode} />;
}
