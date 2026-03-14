import Link from "next/link"
import {
  CalendarDays,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SettingsForm } from "@/features/account/components/settings-form"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getUserPreferences } from "@/features/account/services/get-user-preferences"
import { getUserSettings } from "@/features/account/services/get-user-settings"
import { DetailMetadataCard } from "@/features/dashboard/components/detail-metadata-card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getAccountStatePresentation,
  getUserRolePresentation,
} from "@/features/dashboard/detail-presenters"
import { getUserOrders } from "@/features/orders/services/get-user-orders"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { getWalletSummary } from "@/features/wallet/services/get-wallet-summary"

export default async function DashboardProfilePage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? ""
  const [profile, preferences, walletSummary, billingOverview, recentOrders] =
    await Promise.all([
      getUserSettings(userId),
      getUserPreferences(userId),
      getWalletSummary(userId),
      getBillingOverview(userId),
      getUserOrders(userId, 3),
    ])

  if (!profile) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/95">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRound className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Không thể tải hồ sơ tài khoản</EmptyTitle>
          <EmptyDescription>
            Hệ thống chưa lấy được dữ liệu người dùng hiện tại. Hãy thử làm mới trang hoặc quay lại dashboard.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">Quay lại dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">Mở settings</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const userName = profile.name || "NexCloud User"
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("")
  const latestOrder = recentOrders[0] ?? null
  const role = getUserRolePresentation(profile.role)
  const accountState = getAccountStatePresentation(profile.isActive)

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 bg-card/95 shadow-[0_28px_70px_-48px_rgba(14,165,233,0.35)]">
        <CardHeader className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 rounded-2xl border border-border/70">
              <AvatarImage src={profile.image ?? "/placeholder-user.jpg"} alt={userName} />
              <AvatarFallback className="rounded-2xl bg-foreground/10 text-lg font-semibold text-foreground">
                {userInitials || "NU"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <div className="space-y-1">
                <CardDescription>Profile hub</CardDescription>
                <CardTitle className="text-3xl">{userName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hồ sơ dùng chung cho checkout, billing, đơn hàng và các khu vực tài khoản đã bảo vệ.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DetailStatusBadge label={role.label} tone={role.tone} />
                <DetailStatusBadge label={accountState.label} tone={accountState.tone} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/orders">Đơn hàng</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/wallet">Ví & giao dịch</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Số dư ví</p>
            <p className="mt-2 text-2xl font-semibold">{walletSummary.balanceLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">{walletSummary.transactionCount} giao dịch ví.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng chi tiêu</p>
            <p className="mt-2 text-2xl font-semibold">{billingOverview.totalSpentLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">{billingOverview.successfulPayments} thanh toán hoàn tất.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Đơn hàng gần đây</p>
            <p className="mt-2 text-2xl font-semibold">{recentOrders.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {latestOrder ? `Mới nhất ${formatDateTime(latestOrder.createdAt)}` : "Chưa có đơn hàng."}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Billing pending</p>
            <p className="mt-2 text-2xl font-semibold">{billingOverview.pendingTransactions}</p>
            <p className="mt-2 text-sm text-muted-foreground">Các mục đang chờ xác minh hoặc xử lý tiếp.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <SettingsForm profile={profile} />

        <div className="grid gap-6">
          <DetailMetadataCard
            title="Thông tin liên hệ"
            description="Dùng cho order confirmation, billing follow-up và hỗ trợ sau mua."
            items={[
              {
                label: "Email",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    {profile.email}
                  </span>
                ),
              },
              {
                label: "Số điện thoại",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    {profile.phone || "Chưa cập nhật"}
                  </span>
                ),
              },
              {
                label: "Tham gia từ",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {formatDateTime(profile.joinedAt, { dateStyle: "medium" })}
                  </span>
                ),
              },
              {
                label: "Cập nhật gần nhất",
                value: formatDateTime(profile.updatedAt),
              },
            ]}
          />

          <DetailMetadataCard
            title="Tuỳ chọn tài khoản"
            description="Foundation preferences hiện có trong dữ liệu người dùng."
            items={[
              {
                label: "Theme ưu tiên",
                value: preferences.preferredTheme || "Theo hệ thống",
              },
              {
                label: "Locale",
                value: preferences.locale || "vi-VN",
              },
              {
                label: "Tiền tệ",
                value: preferences.currency,
              },
              {
                label: "Order emails",
                value: preferences.orderEmails ? "Bật" : "Tắt",
              },
              {
                label: "Billing emails",
                value: preferences.billingEmails ? "Bật" : "Tắt",
              },
              {
                label: "Marketing emails",
                value: preferences.marketingEmails ? "Bật" : "Tắt",
              },
            ]}
          />

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-foreground" />
                Account activity
              </CardTitle>
              <CardDescription>
                Tóm tắt nhanh các khu vực user-facing nên theo dõi thường xuyên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium text-foreground">Trạng thái bảo mật</p>
                <p className="mt-2">
                  {profile.emailVerifiedAt
                    ? `Email đã xác minh vào ${formatDateTime(profile.emailVerifiedAt)}.`
                    : "Chưa có flow email verification tự động ở phase hiện tại."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium text-foreground">Đơn hàng gần nhất</p>
                <p className="mt-2">
                  {latestOrder
                    ? `${latestOrder.paymentReference ?? latestOrder.id} • ${latestOrder.totalAmountLabel}`
                    : "Chưa phát sinh đơn hàng nào."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/orders">
                    <ReceiptText className="size-4" />
                    Mở orders
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/wallet">
                    <Wallet2 className="size-4" />
                    Mở wallet
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
