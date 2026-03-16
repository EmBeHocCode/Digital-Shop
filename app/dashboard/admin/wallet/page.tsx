import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminSummaryCard } from "@/features/admin/components/admin-summary-card"
import { AdminWalletAdjustmentDialog } from "@/features/admin/components/admin-wallet-adjustment-dialog"
import { getAdminWalletOverview } from "@/features/admin/services/get-admin-wallet-overview"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getTransactionStatusPresentation,
  getTransactionTypePresentation,
  getWalletStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getAuthSession } from "@/lib/auth"
import { canManageWallet } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminWalletPageProps {
  searchParams: Promise<{
    search?: string
    walletStatus?: string
    transactionStatus?: string
    transactionType?: string
  }>
}

const walletStates = ["ALL", "ACTIVE", "LOCKED", "CLOSED"] as const
const transactionStatuses = ["ALL", "PENDING", "COMPLETED", "FAILED", "CANCELLED"] as const
const transactionTypes = ["ALL", "TOPUP", "PAYMENT", "REFUND", "ADJUSTMENT"] as const

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/dashboard/admin/wallet?${query}` : "/dashboard/admin/wallet"
}

export default async function AdminWalletPage({ searchParams }: AdminWalletPageProps) {
  const session = await getAuthSession()

  if (!canManageWallet(session?.user?.role)) {
    redirect("/access-denied")
  }

  const resolvedSearchParams = await searchParams
  const currentSearch = resolvedSearchParams.search?.trim() || undefined
  const currentWalletStatus = walletStates.includes(
    (resolvedSearchParams.walletStatus ?? "ALL") as (typeof walletStates)[number]
  )
    ? (resolvedSearchParams.walletStatus ?? "ALL")
    : "ALL"
  const currentTransactionStatus = transactionStatuses.includes(
    (resolvedSearchParams.transactionStatus ?? "ALL") as (typeof transactionStatuses)[number]
  )
    ? (resolvedSearchParams.transactionStatus ?? "ALL")
    : "ALL"
  const currentTransactionType = transactionTypes.includes(
    (resolvedSearchParams.transactionType ?? "ALL") as (typeof transactionTypes)[number]
  )
    ? (resolvedSearchParams.transactionType ?? "ALL")
    : "ALL"

  const overview = await getAdminWalletOverview({
    search: currentSearch,
    walletStatus: currentWalletStatus as (typeof walletStates)[number],
    transactionStatus: currentTransactionStatus as (typeof transactionStatuses)[number],
    transactionType: currentTransactionType as (typeof transactionTypes)[number],
  })

  const baseQuery = {
    search: currentSearch,
    walletStatus: currentWalletStatus === "ALL" ? undefined : currentWalletStatus,
    transactionStatus: currentTransactionStatus === "ALL" ? undefined : currentTransactionStatus,
    transactionType: currentTransactionType === "ALL" ? undefined : currentTransactionType,
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Về admin hub</Link>
          </Button>
        }
        description="Theo dõi số dư ví toàn hệ thống, transaction history và điều chỉnh thủ công khi cần review vận hành."
        eyebrow="Admin / wallet ops"
        title="Wallet & transactions"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard description="Tổng số dư ví trên toàn hệ thống." label="Wallet exposure" value={overview.summary.totalBalanceLabel} />
        <AdminSummaryCard description="Số ví đang hoạt động bình thường." label="Active wallets" value={overview.summary.activeWallets} />
        <AdminSummaryCard description="Ví đã bị khoá hoặc hạn chế thao tác." label="Locked wallets" value={overview.summary.lockedWallets} />
        <AdminSummaryCard description="Transaction còn pending cần review." label="Pending txns" value={overview.summary.pendingTransactions} />
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardContent className="grid gap-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <form action="/dashboard/admin/wallet" className="flex w-full flex-col gap-3 md:flex-row xl:max-w-xl">
              <Input defaultValue={currentSearch} name="search" placeholder="Tìm theo user, email, mô tả giao dịch..." />
              {currentWalletStatus !== "ALL" ? (
                <input name="walletStatus" type="hidden" value={currentWalletStatus} />
              ) : null}
              {currentTransactionStatus !== "ALL" ? (
                <input name="transactionStatus" type="hidden" value={currentTransactionStatus} />
              ) : null}
              {currentTransactionType !== "ALL" ? (
                <input name="transactionType" type="hidden" value={currentTransactionType} />
              ) : null}
              <Button type="submit">Tìm kiếm</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {walletStates.map((status) => (
                <Button
                  key={status}
                  asChild
                  size="sm"
                  variant={currentWalletStatus === status ? "default" : "outline"}
                >
                  <Link href={buildHref(baseQuery, { walletStatus: status === "ALL" ? undefined : status })}>
                    Wallet: {status}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {transactionTypes.map((type) => (
              <Button
                key={type}
                asChild
                size="sm"
                variant={currentTransactionType === type ? "default" : "outline"}
              >
                <Link href={buildHref(baseQuery, { transactionType: type === "ALL" ? undefined : type })}>
                  Type: {type}
                </Link>
              </Button>
            ))}
            {transactionStatuses.map((status) => (
              <Button
                key={status}
                asChild
                size="sm"
                variant={currentTransactionStatus === status ? "default" : "outline"}
              >
                <Link
                  href={buildHref(baseQuery, {
                    transactionStatus: status === "ALL" ? undefined : status,
                  })}
                >
                  Status: {status}
                </Link>
              </Button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm font-medium">Wallet balances</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.wallets.length > 0 ? (
                    overview.wallets.map((wallet) => {
                      const status = getWalletStatusPresentation(wallet.status)

                      return (
                        <TableRow key={wallet.id}>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-medium">{wallet.userName}</p>
                              <p className="text-sm text-muted-foreground">{wallet.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <p className="font-semibold">{wallet.balanceLabel}</p>
                            <p className="text-xs text-muted-foreground">{wallet.transactionCount} giao dịch</p>
                          </TableCell>
                          <TableCell className="align-top">
                            <DetailStatusBadge label={status.label} tone={status.tone} />
                          </TableCell>
                          <TableCell className="align-top text-sm text-muted-foreground">
                            {formatDateTime(wallet.updatedAt)}
                          </TableCell>
                          <TableCell className="align-top">
                            <AdminWalletAdjustmentDialog
                              userLabel={wallet.userName}
                              walletId={wallet.id}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                        Không có wallet phù hợp với bộ lọc hiện tại.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm font-medium">Recent transactions</p>
              </div>
              <div className="space-y-4">
                {overview.transactions.length > 0 ? (
                  overview.transactions.map((transaction) => {
                    const status = getTransactionStatusPresentation(transaction.status)
                    const type = getTransactionTypePresentation(transaction.type)

                    return (
                      <div
                        key={transaction.id}
                        className="rounded-2xl border border-border/70 bg-card/80 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <DetailStatusBadge label={type.label} tone={type.tone} />
                          <DetailStatusBadge label={status.label} tone={status.tone} />
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{transaction.userName}</p>
                            <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description || transaction.reference || transaction.id}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">{transaction.amountLabel}</p>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Chưa có transaction nào phù hợp với bộ lọc hiện tại.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
