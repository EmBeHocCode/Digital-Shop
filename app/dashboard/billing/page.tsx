import Link from "next/link"
import { BadgeDollarSign, CreditCard, FileText, Wallet2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getPaymentStatusClassName, getPaymentStatusLabel } from "@/features/payment/utils"
import { getTransactionHistory } from "@/features/wallet/services/get-transaction-history"
import { getWalletSummary } from "@/features/wallet/services/get-wallet-summary"

export default async function DashboardBillingPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? ""
  const [billingOverview, transactions, walletSummary] = await Promise.all([
    getBillingOverview(userId),
    getTransactionHistory(userId, 8),
    getWalletSummary(userId),
  ])

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Chi tiêu đã hoàn tất</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.totalSpentLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {billingOverview.successfulPayments} payment transaction đã completed.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Số dư ví</CardDescription>
            <CardTitle className="text-2xl">{walletSummary.balanceLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {walletSummary.transactionCount} giao dịch liên kết với ví.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Tổng top-up</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.totalTopupsLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chỉ tính transaction `TOPUP` đã completed.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Pending items</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.pendingTransactions}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Gồm payment chờ xác minh và top-up chờ đối soát.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Hoạt động billing gần đây</CardTitle>
            <CardDescription>
              Dùng để đối soát nhanh transaction, trạng thái thanh toán và các bước chuẩn bị cho provider thật.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{transaction.reference ?? transaction.id}</p>
                      <Badge className={getPaymentStatusClassName(transaction.paymentStatus)} variant="outline">
                        {getPaymentStatusLabel(transaction.paymentStatus)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description || transaction.type}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{transaction.amountLabel}</p>
                </div>
              ))
            ) : (
              <Empty className="border-none py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BadgeDollarSign className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Chưa có dữ liệu billing</EmptyTitle>
                  <EmptyDescription>
                    Hoàn tất checkout hoặc nạp ví để hệ thống bắt đầu ghi transaction cho billing.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4 text-foreground" />
                Payment methods
              </CardTitle>
              <CardDescription>
                Foundation cho các provider như Stripe hoặc VNPay đã sẵn sàng, nhưng chưa bật live integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="font-medium">Wallet nội bộ</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanh toán tức thời nếu số dư đủ. Hiện là flow ổn định nhất cho purchase self-service.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 p-4">
                <p className="font-medium">Bank transfer / Provider ngoài</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Đơn sẽ giữ ở trạng thái pending để chờ xác minh hoặc callback provider ở phase sau.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-foreground" />
                Invoice & history
              </CardTitle>
              <CardDescription>
                Chưa có invoice engine riêng, nhưng billing summary đã đủ để làm nền cho export và đối soát.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>- Billing history đang dùng transaction + order summary để hiển thị theo thời gian.</p>
              <p>- Invoice PDF, mã thuế và corporate billing sẽ được thêm sau khi flow checkout ổn định.</p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/orders">Mở danh sách đơn hàng</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet2 className="size-4 text-foreground" />
                Billing actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild>
                <Link href="/dashboard/wallet">Đi tới ví và top-up</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/checkout">Tạo đơn hàng mới</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
