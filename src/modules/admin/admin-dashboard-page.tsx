import {
  faCoins,
  faReceipt,
  faShieldHeart,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { OrdersChart } from "@/components/dashboard/orders-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Table } from "@/components/dashboard/table";
import { UsersGrowthChart } from "@/components/dashboard/users-growth-chart";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { getDashboardChartData, getMarketplaceAnalytics } from "@/services/analytics/analytics-service";
import { getRecentOrders } from "@/services/order-service";
import { getRecentTickets } from "@/services/ticket-service";
import { getProducts } from "@/services/product-service";
import { formatCompactNumber, formatCurrency, formatDate } from "@/utils/format";

export async function AdminDashboardPage() {
  const [analytics, recentOrders, recentTickets, chartData] = await Promise.all([
    getMarketplaceAnalytics(),
    getRecentOrders(),
    getRecentTickets(),
    getDashboardChartData()
  ]);
  const bestSellingProducts = (
    await getProducts({
      page: 1,
      pageSize: 5,
      sort: "popularity"
    })
  ).items;
  const lowStockProducts = (
    await getProducts({
      page: 1,
      pageSize: 20,
      sort: "featured"
    })
  ).items.filter((product) => typeof product.stock === "number" && product.stock < 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Doanh thu"
          value={formatCurrency(analytics.revenue)}
          helper="Tổng doanh thu tính từ dữ liệu đơn hàng trong SQL"
          icon={faCoins}
        />
        <DashboardStatCard
          title="Đơn hàng"
          value={formatCompactNumber(analytics.orderCount)}
          helper="Bao gồm pending, processing và completed"
          icon={faReceipt}
        />
        <DashboardStatCard
          title="Người dùng"
          value={formatCompactNumber(analytics.userCount)}
          helper="Số lượng tài khoản đang được quản lý trong PostgreSQL"
          icon={faUsers}
        />
        <DashboardStatCard
          title="Tỷ lệ thanh toán thành công"
          value={`${analytics.paymentSuccessRate}%`}
          helper="Tỷ lệ callback thanh toán thành công"
          icon={faShieldHeart}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-2xl font-bold text-ink">Biểu đồ doanh thu</h2>
          <div className="mt-6">
            <RevenueChart data={chartData.revenue} />
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-bold text-ink">Biểu đồ đơn hàng</h2>
          <div className="mt-6">
            <OrdersChart data={chartData.orders} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <h2 className="text-2xl font-bold text-ink">Tăng trưởng người dùng</h2>
          <div className="mt-6">
            <UsersGrowthChart data={chartData.users} />
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-bold text-ink">Sản phẩm bán chạy</h2>
          <div className="mt-6 space-y-4">
            {bestSellingProducts.length ? (
              bestSellingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-[20px] bg-rose-50/60 p-4"
                >
                  <div>
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-sm text-muted">{product.type}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                    {product.reviewsCount} đánh giá
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                Chưa có sản phẩm SQL để hiển thị thống kê bán chạy.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-ink">Đơn hàng gần đây</h2>
          <Table
            headers={["Mã đơn", "Ngày", "Tổng", "Trạng thái"]}
            rows={recentOrders.map((order) => [
              order.orderCode,
              formatDate(order.createdAt),
              formatCurrency(order.total),
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="text-xl font-bold text-ink">Cảnh báo tồn kho thấp</h2>
          <div className="mt-5 space-y-3">
            {lowStockProducts.length ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-[20px] bg-slate-50 p-4">
                  <p className="font-semibold text-ink">{product.name}</p>
                  <p className="mt-1 text-sm text-muted">Tồn còn {product.stock}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Không có cảnh báo tồn kho từ dữ liệu SQL.</p>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-ink">Tài khoản đăng ký mới</h2>
          <div className="mt-5 space-y-3">
            {analytics.latestRegistrations.map((user) => (
              <div key={user.id} className="rounded-[20px] bg-slate-50 p-4">
                <p className="font-semibold text-ink">{user.fullName}</p>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-ink">Cảnh báo gần đây</h2>
          <div className="mt-5 space-y-3">
            {analytics.recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-[20px] bg-slate-50 p-4">
                <p className="font-semibold text-ink">{alert.title}</p>
                <p className="mt-1 text-sm text-muted">{alert.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
