import {
  faGift,
  faHeadset,
  faReceipt,
  faServer
} from "@fortawesome/free-solid-svg-icons";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { Table } from "@/components/dashboard/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { getGiftCardInventory } from "@/services/giftcard/giftcard-inventory-service";
import { getRecentOrders } from "@/services/order-service";
import { getRecentTickets } from "@/services/ticket-service";
import { getServiceRecords } from "@/services/vps/vps-instance-service";
import { formatDate } from "@/utils/format";

export async function StaffDashboardPage() {
  const [recentOrders, recentTickets, giftCardCodes, serviceRecords] = await Promise.all([
    getRecentOrders(),
    getRecentTickets(),
    getGiftCardInventory(),
    getServiceRecords()
  ]);

  const availableCodes = giftCardCodes.filter((code) => code.status === "AVAILABLE").length;
  const activeServices = serviceRecords.filter((service) => service.status === "ACTIVE").length;
  const openTickets = recentTickets.filter(
    (ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#fff0f6] to-[#eef3ff]">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">Staff workspace</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Bảng điều khiển nhân viên</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Khu vực này tập trung vào các nghiệp vụ hằng ngày như theo dõi đơn hàng, xử lý ticket,
          kiểm tra kho gift card và giám sát dịch vụ. Các mục cấu hình hệ thống và quản trị sâu vẫn
          chỉ dành cho admin.
        </p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Đơn cần theo dõi"
          value={String(recentOrders.length)}
          helper="Danh sách đơn gần đây để kiểm tra trạng thái và thanh toán."
          icon={faReceipt}
        />
        <DashboardStatCard
          title="Ticket đang mở"
          value={String(openTickets)}
          helper="Các ticket cần phản hồi hoặc đang xử lý."
          icon={faHeadset}
        />
        <DashboardStatCard
          title="Gift card khả dụng"
          value={String(availableCodes)}
          helper="Số mã còn sẵn trong kho để giao cho đơn mới."
          icon={faGift}
        />
        <DashboardStatCard
          title="Dịch vụ đang hoạt động"
          value={String(activeServices)}
          helper="VPS hoặc cloud đang ở trạng thái active."
          icon={faServer}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ink">Đơn hàng gần đây</h2>
          <Table
            headers={["Mã đơn", "Ngày", "Thanh toán", "Trạng thái"]}
            rows={recentOrders.map((order) => [
              order.orderCode,
              formatDate(order.createdAt),
              order.payment.method,
              <StatusBadge key={order.id} status={order.status} />
            ])}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ink">Phiếu hỗ trợ gần đây</h2>
          <Table
            headers={["Tiêu đề", "Danh mục", "Ngày", "Trạng thái"]}
            rows={recentTickets.map((ticket) => [
              ticket.subject,
              ticket.category,
              formatDate(ticket.createdAt),
              <StatusBadge key={ticket.id} status={ticket.status} />
            ])}
          />
        </div>
      </div>
    </div>
  );
}
