import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";
import { formatCurrency, formatDate } from "@/utils/format";

export default async function ProfileOrdersRoute() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Đơn hàng</h1>
      {profile.orders.length ? (
        <Table
          headers={["Mã đơn", "Ngày", "Tổng tiền", "Thanh toán", "Trạng thái", "Chi tiết"]}
          rows={profile.orders.map((order) => [
            order.orderCode,
            formatDate(order.createdAt),
            formatCurrency(order.total),
            order.payment.method,
            <Badge key={order.id} label={order.status} status={order.status} />,
            <Link key={`${order.id}-detail`} href={`/profile/orders/${order.orderCode}`} className="font-semibold text-primary">
              Xem
            </Link>
          ])}
        />
      ) : (
        <EmptyState
          title="Bạn chưa có đơn hàng nào"
          description="Khi bạn đặt đơn đầu tiên, lịch sử giao dịch sẽ xuất hiện tại đây."
          ctaLabel="Mua sản phẩm"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
