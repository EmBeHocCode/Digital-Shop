import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Wallet } from "lucide-react"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { getBillingOverview } from "@/features/account/services/get-billing-overview"
import { getPaymentMethodLabel, getPaymentProviderLabel, getPaymentStatusClassName, getPaymentStatusLabel } from "@/features/payment/utils"
import { TopupRequestForm } from "@/features/wallet/components/topup-request-form"
import { getTransactionHistory } from "@/features/wallet/services/get-transaction-history"
import { getWalletSummary } from "@/features/wallet/services/get-wallet-summary"

export default async function DashboardWalletPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id ?? ""
  const [walletSummary, billingOverview, transactions] = await Promise.all([
    getWalletSummary(userId),
    getBillingOverview(userId),
    getTransactionHistory(userId),
  ])

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Số dư hiện tại</CardDescription>
            <CardTitle className="text-2xl">{walletSummary.balanceLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {walletSummary.hasWallet ? "Ví đang hoạt động." : "Ví chưa được khởi tạo."}
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Tổng nạp</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.totalTopupsLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tính trên các transaction `TOPUP` đã completed.
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
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{billingOverview.pendingTransactions}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Các yêu cầu chờ xác nhận hoặc chờ provider callback.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>
              Bao gồm thanh toán đơn hàng, yêu cầu nạp ví và các transaction liên quan tới tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{transaction.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.reference ?? transaction.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
                      <TableCell>{getPaymentProviderLabel(transaction.paymentProvider)}</TableCell>
                      <TableCell>
                        <Badge
                          className={getPaymentStatusClassName(transaction.paymentStatus)}
                          variant="outline"
                        >
                          {getPaymentStatusLabel(transaction.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {transaction.amountLabel}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border-none py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Wallet className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Chưa có giao dịch nào</EmptyTitle>
                  <EmptyDescription>
                    Tạo yêu cầu nạp ví hoặc hoàn tất checkout để hệ thống bắt đầu ghi transaction.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <TopupRequestForm />
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Ghi chú triển khai</CardTitle>
              <CardDescription>
                Foundation hiện tại ưu tiên tính đúng đắn của transaction trước khi nối gateway thật.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>- Nạp ví hiện tạo transaction pending, chưa cộng tiền ngay vào số dư.</p>
              <p>- Thanh toán qua ví sẽ dùng Prisma transaction để tạo order và trừ số dư atomically.</p>
              <p>- Bank transfer và manual confirmation đã sẵn sàng để nối Stripe hoặc VNPay sau này.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
