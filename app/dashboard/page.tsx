import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/features/dashboard/components/revenue-chart"
import { SessionsChart } from "@/features/dashboard/components/sessions-chart"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getPurchasedProducts } from "@/features/account/services/get-purchased-products"
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Số dư ví</CardDescription>
            <CardTitle className="text-2xl">{walletSummary.balanceLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {walletSummary.transactionCount} giao dịch được liên kết với ví hiện tại.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Tổng chi tiêu</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.totalSpentLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {billingOverview.successfulPayments} thanh toán đã hoàn tất.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Đơn hàng gần đây</CardDescription>
            <CardTitle className="text-2xl">{recentOrders.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {recentOrders.length > 0
              ? `Đơn mới nhất được tạo lúc ${formatDateTime(recentOrders[0].createdAt)}.`
              : "Chưa có đơn hàng nào được tạo."}
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Sản phẩm đã mua</CardDescription>
            <CardTitle className="text-2xl">{purchasedProducts.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {billingOverview.pendingTransactions} giao dịch đang chờ xử lý.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Đơn hàng gần đây</CardTitle>
            <CardDescription>
              Tóm tắt nhanh để theo dõi trạng thái và phương thức thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
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
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/orders/${order.id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Chưa có đơn hàng nào. Bạn có thể bắt đầu từ catalog dịch vụ rồi quay lại dashboard để theo dõi.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Giao dịch mới nhất</CardTitle>
            <CardDescription>
              Hoạt động ví và thanh toán gần đây của tài khoản hiện tại.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
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
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Chưa có giao dịch nào được ghi nhận.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <SessionsChart />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Tổng quan thanh toán</CardTitle>
            <CardDescription>
              Foundation này đã sẵn sàng cho các provider như Stripe hoặc VNPay ở phase sau.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng nạp</p>
              <p className="mt-2 text-xl font-semibold">{billingOverview.totalTopupsLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pending</p>
              <p className="mt-2 text-xl font-semibold">{billingOverview.pendingTransactions}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ví khả dụng</p>
              <p className="mt-2 text-xl font-semibold">
                {formatCurrency(billingOverview.walletBalance, billingOverview.currency)}
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">Mở billing detail</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Danh mục đã mua</CardTitle>
            <CardDescription>
              Gợi ý nhóm dịch vụ đang được tài khoản này sử dụng nhiều nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {purchasedProducts.length > 0 ? (
              purchasedProducts.slice(0, 4).map((product) => (
                <div key={product.productId} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{product.name}</p>
                    <Badge variant="outline">{product.totalQuantity} lượt</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.category} • Chi tiêu {product.totalSpentLabel}
                  </p>
                  <Button asChild className="mt-4" size="sm" variant="outline">
                    <Link href={`/dashboard/purchased-products/${product.productId}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Chưa có dữ liệu purchased products.
              </div>
            )}
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard/purchased-products">Mở purchased products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/profile">Mở hồ sơ tài khoản</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
