import { Table } from "@/components/dashboard/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { getOrders } from "@/services/order-service";
import { formatCurrency } from "@/utils/format";

export default async function StaffPaymentsRoute() {
  const orders = await getOrders();
  const payments = orders.map((order) => order.payment);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Theo dõi thanh toán</h1>
      <Table
        headers={["Cổng thanh toán", "Mã giao dịch", "Đơn hàng", "Số tiền", "Trạng thái"]}
        rows={payments.map((payment) => [
          payment.method,
          payment.transactionCode ?? "-",
          payment.orderId,
          formatCurrency(payment.amount),
          <StatusBadge key={payment.id} status={payment.status} />
        ])}
      />
    </div>
  );
}
