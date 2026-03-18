import Link from "next/link"
import { redirect } from "next/navigation"
import { BadgeDollarSign, Boxes, ReceiptText, Sparkles, Wallet2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RevenueChart } from "@/features/dashboard/components/revenue-chart"
import { SessionsChart } from "@/features/dashboard/components/sessions-chart"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getPurchasedProducts } from "@/features/account/services/get-purchased-products"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionHeader } from "@/features/dashboard/components/section-header"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { getAuthSession } from "@/lib/auth"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { getUserOrders } from "@/features/orders/services/get-user-orders"
import { getWalletSummary } from "@/features/wallet/services/get-wallet-summary"
import { getTransactionHistory } from "@/features/wallet/services/get-transaction-history"
import { getPaymentMethodLabel, getPaymentStatusClassName, getPaymentStatusLabel } from "@/features/payment/utils"

export default async function DashboardPage() {
  const session = await getAuthSession()

  if (session?.user?.role === "CUSTOMER") {
    redirect("/dashboard/profile")
  }

  const userId = session?.user?.id ?? ""

  const [walletSummary, billingOverview, recentOrders, purchasedProducts, transactions] =
    await Promise.all([
      getWalletSummary(userId),
      getBillingOverview(userId),
      getUserOrders(userId, 5),
      getPurchasedProducts(userId),
      getTransactionHistory(userId, 5),
    ])

  return (
    <>
      <PremiumCard className="overflow-hidden" variant="hero">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500/12 via-cyan-400/6 to-emerald-500/10" />
        <div className="space-y-6 p-6 md:p-8">
          <SectionHeader
            action={
              <>
                <Button
                  asChild
                  className="border border-sky-500/20 bg-foreground text-background shadow-[0_18px_36px_-24px_rgba(56,189,248,0.48)] transition-all hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/92"
                >
                  <Link href="/dashboard/admin/orders">Mở đơn hàng</Link>
                </Button>
                <Button asChild className="hover:border-cyan-400/30 hover:bg-cyan-500/8" variant="outline">
                  <Link href="/dashboard/billing">Xem billing</Link>
                </Button>
              </>
            }
            description={`Theo dõi ví, thanh toán, đơn hàng và danh mục đã mua trong một workspace có phân cấp rõ hơn cho ${session?.user?.name || "tài khoản hiện tại"}.`}
            eyebrow="Operations pulse"
            highlightTitle
            title="Overview vận hành với chiều sâu tốt hơn."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200" variant="outline">
              Stripe sync active
            </Badge>
            <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-200" variant="outline">
              {billingOverview.pendingTransactions} pending items
            </Badge>
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200" variant="outline">
              {purchasedProducts.length} purchased categories
            </Badge>
            <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-200" variant="outline">
              <Sparkles className="mr-1 size-3.5" />
              layered SaaS workspace
            </Badge>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="blue"
          description={`${walletSummary.transactionCount} giao dịch được liên kết với ví hiện tại.`}
          icon={Wallet2}
          label="Số dư ví"
          value={walletSummary.balanceLabel}
        />
        <StatCard
          accent="cyan"
          description={`${billingOverview.successfulPayments} thanh toán đã hoàn tất.`}
          icon={BadgeDollarSign}
          label="Tổng chi tiêu"
          value={billingOverview.totalSpentLabel}
        />
        <StatCard
          accent="violet"
          description={
            recentOrders.length > 0
              ? `Đơn mới nhất được tạo lúc ${formatDateTime(recentOrders[0].createdAt)}.`
              : "Chưa có đơn hàng nào được tạo."
          }
          icon={ReceiptText}
          label="Đơn hàng gần đây"
          value={recentOrders.length}
        />
        <StatCard
          accent="emerald"
          description={`${billingOverview.pendingTransactions} giao dịch đang chờ xử lý.`}
          icon={Boxes}
          label="Sản phẩm đã mua"
          value={purchasedProducts.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <PremiumCard className="p-6" variant="muted">
          <SectionHeader
            description="Tóm tắt nhanh để theo dõi trạng thái, phương thức thanh toán và các đơn cần xử lý tiếp."
            eyebrow="Order stream"
            title="Đơn hàng gần đây"
            titleClassName="text-xl sm:text-2xl"
          />
          <div className="mt-6 space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="premium-data-item flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{order.paymentReference ?? order.id}</p>
                      <Badge variant="outline">{order.status}</Badge>
                      <Badge
                        className={getPaymentStatusClassName(order.paymentStatus)}
                        variant="outline"
                      >
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} sản phẩm • {getPaymentMethodLabel(order.paymentMethod)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">{order.totalAmountLabel}</div>
                    <Button asChild className="hover:border-sky-400/30 hover:bg-sky-500/8" size="sm" variant="outline">
                      <Link href={`/dashboard/orders/${order.id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-6 text-sm text-muted-foreground">
                Chưa có đơn hàng nào. Bạn có thể bắt đầu từ catalog dịch vụ rồi quay lại dashboard để theo dõi.
              </div>
            )}
          </div>
        </PremiumCard>

        <PremiumCard className="p-6" variant="muted">
          <SectionHeader
            description="Hoạt động ví và thanh toán gần đây của tài khoản hiện tại, với trạng thái rõ ràng hơn."
            eyebrow="Payments stream"
            title="Giao dịch mới nhất"
            titleClassName="text-xl sm:text-2xl"
          />
          <div className="mt-6 space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="premium-data-item p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{transaction.amountLabel}</p>
                    <Badge
                      className={getPaymentStatusClassName(transaction.paymentStatus)}
                      variant="outline"
                    >
                      {getPaymentStatusLabel(transaction.paymentStatus)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {transaction.description || getPaymentMethodLabel(transaction.paymentMethod)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {formatDateTime(transaction.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-6 text-sm text-muted-foreground">
                Chưa có giao dịch nào được ghi nhận.
              </div>
            )}
          </div>
        </PremiumCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <SessionsChart />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <PremiumCard className="p-6" variant="muted">
          <SectionHeader
            description="Stripe payment initiation và webhook sync đã hoạt động. Khối này gom nhanh các chỉ số tài chính nền đang có."
            eyebrow="Billing foundation"
            title="Tổng quan thanh toán"
            titleClassName="text-xl sm:text-2xl"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="premium-data-item p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng nạp</p>
              <p className="mt-2 text-xl font-semibold">{billingOverview.totalTopupsLabel}</p>
            </div>
            <div className="premium-data-item p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pending</p>
              <p className="mt-2 text-xl font-semibold">{billingOverview.pendingTransactions}</p>
            </div>
            <div className="premium-data-item p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ví khả dụng</p>
              <p className="mt-2 text-xl font-semibold">
                {formatCurrency(billingOverview.walletBalance, billingOverview.currency)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button asChild className="hover:border-sky-400/30 hover:bg-sky-500/8" variant="outline">
              <Link href="/dashboard/billing">Mở billing detail</Link>
            </Button>
          </div>
        </PremiumCard>

        <PremiumCard className="p-6" variant="muted">
          <SectionHeader
            description="Nhóm dịch vụ đang được tài khoản này sử dụng nhiều nhất, với lối đi nhanh sang hồ sơ sở hữu."
            eyebrow="Ownership map"
            title="Danh mục đã mua"
            titleClassName="text-xl sm:text-2xl"
          />
          <div className="mt-6 space-y-4">
            {purchasedProducts.length > 0 ? (
              purchasedProducts.slice(0, 4).map((product) => (
                <div key={product.productId} className="premium-data-item p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{product.name}</p>
                    <Badge variant="outline">{product.totalQuantity} lượt</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.category} • Chi tiêu {product.totalSpentLabel}
                  </p>
                  <Button asChild className="mt-4 hover:border-cyan-400/30 hover:bg-cyan-500/8" size="sm" variant="outline">
                    <Link href={`/dashboard/purchased-products/${product.productId}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-6 text-sm text-muted-foreground">
                Chưa có dữ liệu purchased products.
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="hover:border-cyan-400/30 hover:bg-cyan-500/8" variant="outline">
              <Link href="/dashboard/purchased-products">Mở purchased products</Link>
            </Button>
            <Button asChild className="hover:border-violet-400/30 hover:bg-violet-500/8" variant="outline">
              <Link href="/dashboard/profile">Mở hồ sơ tài khoản</Link>
            </Button>
          </div>
        </PremiumCard>
      </div>
    </>
  )
}
