import Link from "next/link"
import {
  CalendarDays,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SettingsForm } from "@/features/account/components/settings-form"
import { ProfileAvatarUploader } from "@/features/account/components/profile-avatar-uploader"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getUserPreferences } from "@/features/account/services/get-user-preferences"
import { getUserSettings } from "@/features/account/services/get-user-settings"
import { DetailMetadataCard } from "@/features/dashboard/components/detail-metadata-card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import { InfoPanel } from "@/features/dashboard/components/info-panel"
import { ProfileHero } from "@/features/dashboard/components/profile-hero"
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
  const latestOrder = recentOrders[0] ?? null
  const role = getUserRolePresentation(profile.role)
  const accountState = getAccountStatePresentation(profile.isActive)

  return (
    <div className="grid gap-6">
      <ProfileHero
        actions={
          <>
            <Button
              asChild
              className="border border-sky-500/20 bg-foreground text-background shadow-[0_18px_36px_-24px_rgba(56,189,248,0.48)] transition-all hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/92"
            >
              <Link href="/dashboard/orders">Đơn hàng</Link>
            </Button>
            <Button asChild className="hover:border-cyan-400/30 hover:bg-cyan-500/8" variant="outline">
              <Link href="/dashboard/wallet">Ví & giao dịch</Link>
            </Button>
            <Button asChild className="hover:border-violet-400/30 hover:bg-violet-500/8" variant="outline">
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
          </>
        }
        avatar={<ProfileAvatarUploader email={profile.email} image={profile.image} name={userName} />}
        badges={
          <>
            <DetailStatusBadge label={role.label} tone={role.tone} />
            <DetailStatusBadge label={accountState.label} tone={accountState.tone} />
          </>
        }
        description="Hồ sơ dùng chung cho checkout, billing, đơn hàng và các khu vực tài khoản đã bảo vệ. Đây là điểm trung tâm để quản lý danh tính, thông tin liên hệ và nhịp hoạt động của tài khoản."
        identityMeta={
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/90">
              <Mail className="size-3.5 text-sky-300" />
              {profile.email}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/90">
              <Sparkles className="size-3.5 text-cyan-300" />
              Hồ sơ đang đồng bộ với checkout và billing
            </span>
          </>
        }
        metrics={[
          {
            icon: Wallet2,
            label: "Số dư ví",
            value: walletSummary.balanceLabel,
            description: `${walletSummary.transactionCount} giao dịch ví.`,
          },
          {
            icon: ReceiptText,
            label: "Tổng chi tiêu",
            value: billingOverview.totalSpentLabel,
            description: `${billingOverview.successfulPayments} thanh toán hoàn tất.`,
          },
          {
            icon: CalendarDays,
            label: "Đơn hàng gần đây",
            value: recentOrders.length,
            description: latestOrder ? `Mới nhất ${formatDateTime(latestOrder.createdAt)}` : "Chưa có đơn hàng.",
          },
          {
            icon: ShieldCheck,
            label: "Billing pending",
            value: billingOverview.pendingTransactions,
            description: "Các mục đang chờ xác minh hoặc xử lý tiếp.",
          },
        ]}
        title={userName}
      />

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

          <InfoPanel
            description="Theo dõi nhanh các tín hiệu bảo mật, đơn hàng mới nhất và các khu vực nên mở thường xuyên."
            eyebrow="Activity lane"
            title="Account activity"
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="premium-data-item p-4">
                <p className="font-medium text-foreground">Trạng thái bảo mật</p>
                <p className="mt-2">
                  {profile.emailVerifiedAt
                    ? `Email đã xác minh vào ${formatDateTime(profile.emailVerifiedAt)}.`
                    : "Email chưa được xác minh. Hãy kiểm tra hộp thư hoặc dùng trang xác minh để hoàn tất bảo mật tài khoản."}
                </p>
              </div>
              <div className="premium-data-item p-4">
                <p className="font-medium text-foreground">Đơn hàng gần nhất</p>
                <p className="mt-2">
                  {latestOrder
                    ? `${latestOrder.paymentReference ?? latestOrder.id} • ${latestOrder.totalAmountLabel}`
                    : "Chưa phát sinh đơn hàng nào."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild className="hover:border-sky-400/30 hover:bg-sky-500/8" variant="outline">
                  <Link href="/dashboard/orders">
                    <ReceiptText className="size-4" />
                    Mở orders
                  </Link>
                </Button>
                <Button asChild className="hover:border-cyan-400/30 hover:bg-cyan-500/8" variant="outline">
                  <Link href="/dashboard/wallet">
                    <Wallet2 className="size-4" />
                    Mở wallet
                  </Link>
                </Button>
              </div>
            </div>
          </InfoPanel>
        </div>
      </div>
    </div>
  )
}
