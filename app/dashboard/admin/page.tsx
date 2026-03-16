import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getAccountStatePresentation,
  getOrderStatusPresentation,
  getTransactionStatusPresentation,
  getUserRolePresentation,
} from "@/features/dashboard/detail-presenters"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminSummaryCard } from "@/features/admin/components/admin-summary-card"
import { getAdminOverview } from "@/features/admin/services/get-admin-overview"
import { getAuthSession } from "@/lib/auth"
import {
  canManageOrders,
  canManageProducts,
  canManageSystemSettings,
  canManageUsers,
  canManageWallet,
} from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const session = await getAuthSession()
  const overview = await getAdminOverview()
  const role = session?.user?.role
  const showUserOperations = canManageUsers(role)
  const showProductOperations = canManageProducts(role)
  const showWalletOperations = canManageWallet(role)

  const shortcuts = [
    canManageOrders(role)
      ? { href: "/dashboard/admin/orders", label: "Mở Orders", variant: "default" as const }
      : null,
    canManageUsers(role)
      ? { href: "/dashboard/admin/users", label: "Quản lý Users", variant: "outline" as const }
      : null,
    canManageWallet(role)
      ? { href: "/dashboard/admin/wallet", label: "Ví & giao dịch", variant: "outline" as const }
      : null,
    canManageProducts(role)
      ? { href: "/dashboard/admin/products", label: "Quản lý Products", variant: "outline" as const }
      : null,
    canManageSystemSettings(role)
      ? { href: "/dashboard/admin/sql-manager", label: "SQL Manager", variant: "outline" as const }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; variant: "default" | "outline" }>

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={shortcuts.map((shortcut) => (
          <Button key={shortcut.href} asChild variant={shortcut.variant}>
            <Link href={shortcut.href}>{shortcut.label}</Link>
          </Button>
        ))}
        description="Khối vận hành nội bộ cho đơn hàng, khách hàng, ví, sản phẩm và các tác vụ database của marketplace."
        eyebrow="Root app / admin"
        title="Admin Operations"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          description="Những đơn đang chờ review hoặc xử lý bước đầu."
          label="Pending orders"
          value={overview.pendingOrders}
        />
        {showWalletOperations ? (
          <AdminSummaryCard
            description="Wallet balances cộng gộp trên toàn bộ user hiện có."
            label="Wallet exposure"
            value={overview.walletExposureLabel}
          />
        ) : null}
        {showUserOperations ? (
          <AdminSummaryCard
            description={`${overview.activeUsers}/${overview.totalUsers} tài khoản đang hoạt động.`}
            label="Users"
            value={overview.totalUsers}
          />
        ) : null}
        {showProductOperations ? (
          <AdminSummaryCard
            description={`${overview.draftProducts} sản phẩm vẫn ở trạng thái nháp.`}
            label="Active products"
            value={overview.activeProducts}
          />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>
              Theo dõi nhanh đơn hàng mới, trạng thái xử lý và điểm cần đối soát thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentOrders.length > 0 ? (
              overview.recentOrders.map((order) => {
                const orderStatus = getOrderStatusPresentation(order.status)
                const paymentStatus = getTransactionStatusPresentation(order.paymentStatus)

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{order.customerName}</p>
                          <DetailStatusBadge label={orderStatus.label} tone={orderStatus.tone} />
                          <DetailStatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold">{order.totalAmountLabel}</p>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/orders/${order.id}`}>Chi tiết</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Chưa có đơn hàng nào trong hệ thống.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {showUserOperations ? (
            <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Recent users</CardTitle>
              <CardDescription>
                Dùng để review đăng ký mới, quyền hạn và các trường hợp inactive cần follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.recentUsers.map((user) => {
                const roleStatus = getUserRolePresentation(user.role)
                const accountState = getAccountStatePresentation(user.isActive)

                return (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <DetailStatusBadge label={roleStatus.label} tone={roleStatus.tone} />
                      <DetailStatusBadge label={accountState.label} tone={accountState.tone} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </p>
                      {canManageUsers(role) ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/users/${user.id}`}>Xem user</Link>
                        </Button>
                      ) : (
                        <Badge variant="outline">Read only</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
          ) : null}

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Operations pulse</CardTitle>
              <CardDescription>
                Nhóm số liệu ngắn để đội vận hành biết nên ưu tiên khu nào trước.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium text-foreground">Processing queue</p>
                <p className="mt-2">{overview.processingOrders} đơn đang được xử lý.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium text-foreground">Payment review</p>
                <p className="mt-2">{overview.pendingTransactions} transaction đang pending.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
