import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { getOrders } from "@/services/order-service";
import { formatCurrency, formatDate } from "@/utils/format";

export default async function AdminOrdersRoute() {
  const orders = await getOrders();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Quản lý đơn hàng</h1>
      <Table
        headers={["Mã đơn", "Ngày", "Thanh toán", "Tổng", "Trạng thái"]}
        rows={orders.map((order) => [
          order.orderCode,
          formatDate(order.createdAt),
          order.payment.method,
          formatCurrency(order.total),
          <Badge key={order.id} label={order.status} status={order.status} />
        ])}
      />
    </div>
  );
}
