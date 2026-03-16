import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DetailMetadataCard } from "@/features/dashboard/components/detail-metadata-card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getAccountStatePresentation,
  getTransactionStatusPresentation,
  getUserRolePresentation,
  getWalletStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { AdminUserActions } from "@/features/admin/components/admin-user-actions"
import { getAdminUserById } from "@/features/admin/services/get-admin-users"
import { getAuthSession } from "@/lib/auth"
import { canManageUsers } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminUserDetailPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const session = await getAuthSession()

  if (!canManageUsers(session?.user?.role)) {
    redirect("/access-denied")
  }

  const { userId } = await params
  const user = await getAdminUserById(userId)

  if (!user) {
    notFound()
  }

  const roleStatus = getUserRolePresentation(user.role)
  const accountState = getAccountStatePresentation(user.isActive)
  const walletState = user.wallet.status ? getWalletStatusPresentation(user.wallet.status) : null

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 bg-card/95 shadow-[0_26px_80px_-58px_rgba(14,165,233,0.35)]">
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <CardDescription>Admin user detail</CardDescription>
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <DetailStatusBadge label={roleStatus.label} tone={roleStatus.tone} />
              <DetailStatusBadge label={accountState.label} tone={accountState.tone} />
              {walletState ? <DetailStatusBadge label={walletState.label} tone={walletState.tone} /> : null}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/admin/users">Quay lại users</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/admin/wallet">Mở wallet ops</Link>
              </Button>
            </div>
            <AdminUserActions
              currentRole={user.role}
              isActive={user.isActive}
              isSelf={session?.user?.id === user.id}
              userId={user.id}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-6">
          <DetailMetadataCard
            description="Thông tin tài khoản gốc và metadata liên hệ đang dùng trên hệ thống."
            items={[
              { label: "User ID", value: user.id },
              { label: "Email", value: user.email },
              { label: "Số điện thoại", value: user.phone || "Chưa cập nhật" },
              { label: "Email verified", value: user.emailVerifiedAt ? formatDateTime(user.emailVerifiedAt) : "Chưa xác minh" },
              { label: "Tham gia từ", value: formatDateTime(user.createdAt) },
              { label: "Cập nhật gần nhất", value: formatDateTime(user.updatedAt) },
            ]}
            title="Thông tin tài khoản"
          />

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>
                Nhanh chóng nhìn các đơn gần đây của user để support hoặc escalation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.recentOrders.length > 0 ? (
                user.recentOrders.map((order) => {
                  const paymentStatus = getTransactionStatusPresentation(order.paymentStatus)

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <DetailStatusBadge label={order.status} tone="neutral" />
                        <DetailStatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
                      </div>
                      <p className="mt-3 text-sm font-semibold">{order.totalAmountLabel}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                      <Button asChild className="mt-4" size="sm" variant="outline">
                        <Link href={`/dashboard/admin/orders/${order.id}`}>Mở order</Link>
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  User này chưa có đơn hàng nào.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Wallet & preferences</CardTitle>
              <CardDescription>
                Nhìn nhanh tình trạng ví và preference liên quan tới communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium text-foreground">Wallet balance</p>
                <p className="mt-2 text-2xl font-semibold">{user.wallet.balanceLabel}</p>
                <p className="mt-2 text-muted-foreground">
                  {walletState ? walletState.label : "Chưa tạo ví"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-muted-foreground">
                <p className="font-medium text-foreground">Preferences</p>
                {user.preferences ? (
                  <ul className="mt-3 space-y-2">
                    <li>Theme: {user.preferences.preferredTheme || "Theo hệ thống"}</li>
                    <li>Locale: {user.preferences.locale || "vi-VN"}</li>
                    <li>Currency: {user.preferences.currency}</li>
                    <li>Order emails: {user.preferences.orderEmails ? "Bật" : "Tắt"}</li>
                    <li>Billing emails: {user.preferences.billingEmails ? "Bật" : "Tắt"}</li>
                    <li>Marketing emails: {user.preferences.marketingEmails ? "Bật" : "Tắt"}</li>
                  </ul>
                ) : (
                  <p className="mt-2">Chưa có preference record riêng.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Security events</CardTitle>
              <CardDescription>
                Nền tảng audit cơ bản cho sign in / register / profile updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.recentSecurityEvents.length > 0 ? (
                user.recentSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm"
                  >
                    <p className="font-medium">{event.type}</p>
                    <p className="mt-1 text-muted-foreground">{event.ipAddress || "Không có IP"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Chưa có security event nào cho user này.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
