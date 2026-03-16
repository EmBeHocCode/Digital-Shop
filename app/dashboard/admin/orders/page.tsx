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
import { AdminOrderActions } from "@/features/admin/components/admin-order-actions"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminSummaryCard } from "@/features/admin/components/admin-summary-card"
import { getAdminOrders } from "@/features/admin/services/get-admin-orders"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getOrderStatusPresentation,
  getTransactionStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getAuthSession } from "@/lib/auth"
import { canManageOrders } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminOrdersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentStatus?: string
    page?: string
  }>
}

const orderStatuses = ["ALL", "PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"] as const
const paymentStatuses = ["ALL", "PENDING", "COMPLETED", "FAILED", "CANCELLED"] as const

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/dashboard/admin/orders?${query}` : "/dashboard/admin/orders"
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await getAuthSession()

  if (!canManageOrders(session?.user?.role)) {
    redirect("/access-denied")
  }

  const resolvedSearchParams = await searchParams
  const currentSearch = resolvedSearchParams.search?.trim() || undefined
  const currentStatus = orderStatuses.includes(
    (resolvedSearchParams.status ?? "ALL") as (typeof orderStatuses)[number]
  )
    ? (resolvedSearchParams.status ?? "ALL")
    : "ALL"
  const currentPaymentStatus = paymentStatuses.includes(
    (resolvedSearchParams.paymentStatus ?? "ALL") as (typeof paymentStatuses)[number]
  )
    ? (resolvedSearchParams.paymentStatus ?? "ALL")
    : "ALL"
  const currentPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1

  const result = await getAdminOrders({
    search: currentSearch,
    status: currentStatus as (typeof orderStatuses)[number],
    paymentStatus: currentPaymentStatus as (typeof paymentStatuses)[number],
    page: currentPage,
  })

  const baseQuery = {
    search: currentSearch,
    status: currentStatus === "ALL" ? undefined : currentStatus,
    paymentStatus: currentPaymentStatus === "ALL" ? undefined : currentPaymentStatus,
  }

  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize))

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Về admin hub</Link>
          </Button>
        }
        description="Theo dõi đơn hàng toàn hệ thống, lọc theo trạng thái và thao tác trực tiếp từ backoffice."
        eyebrow="Admin / operations"
        title="Orders management"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard description="Tất cả order khớp bộ lọc hiện tại." label="Tổng đơn" value={result.summary.total} />
        <AdminSummaryCard description="Các đơn cần follow-up vận hành." label="Pending" value={result.summary.pending} />
        <AdminSummaryCard description="Đơn đang được xử lý hoặc provision." label="Processing" value={result.summary.processing} />
        <AdminSummaryCard description="Order có payment status đang pending." label="Payment pending" value={result.summary.paymentPending} />
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardContent className="grid gap-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <form action="/dashboard/admin/orders" className="flex w-full flex-col gap-3 md:flex-row xl:max-w-xl">
              <Input defaultValue={currentSearch} name="search" placeholder="Tìm theo email, tên, mã đơn..." />
              {currentStatus !== "ALL" ? <input name="status" type="hidden" value={currentStatus} /> : null}
              {currentPaymentStatus !== "ALL" ? (
                <input name="paymentStatus" type="hidden" value={currentPaymentStatus} />
              ) : null}
              <Button type="submit">Tìm kiếm</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {orderStatuses.map((status) => (
                <Button
                  key={status}
                  asChild
                  size="sm"
                  variant={currentStatus === status ? "default" : "outline"}
                >
                  <Link href={buildHref(baseQuery, { status: status === "ALL" ? undefined : status, page: undefined })}>
                    {status}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {paymentStatuses.map((status) => (
              <Button
                key={status}
                asChild
                size="sm"
                variant={currentPaymentStatus === status ? "default" : "outline"}
              >
                <Link
                  href={buildHref(baseQuery, {
                    paymentStatus: status === "ALL" ? undefined : status,
                    page: undefined,
                  })}
                >
                  Payment: {status}
                </Link>
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead className="min-w-[240px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length > 0 ? (
                result.items.map((order) => {
                  const orderStatus = getOrderStatusPresentation(order.status)
                  const paymentStatus = getTransactionStatusPresentation(order.paymentStatus)

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                          {order.customerPhone ? (
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <p className="font-mono text-xs text-muted-foreground">
                            {order.paymentReference ?? order.id}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <DetailStatusBadge label={orderStatus.label} tone={orderStatus.tone} />
                            <DetailStatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {order.itemsCount} items / {order.transactionsCount} txns
                      </TableCell>
                      <TableCell className="align-top font-semibold">{order.totalAmountLabel}</TableCell>
                      <TableCell className="align-top">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/orders/${order.id}`}>Chi tiết</Link>
                        </Button>
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminOrderActions orderId={order.id} paymentStatus={order.paymentStatus} />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
                    Không có đơn hàng phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {result.page}/{totalPages} • hiển thị {result.items.length}/{result.totalCount} đơn
            </p>
            <div className="flex gap-2">
              <Button
                asChild
                disabled={result.page <= 1}
                size="sm"
                variant="outline"
              >
                <Link href={buildHref(baseQuery, { page: result.page > 1 ? `${result.page - 1}` : undefined })}>
                  Trước
                </Link>
              </Button>
              <Button
                asChild
                disabled={result.page >= totalPages}
                size="sm"
                variant="outline"
              >
                <Link
                  href={buildHref(baseQuery, {
                    page: result.page < totalPages ? `${result.page + 1}` : undefined,
                  })}
                >
                  Sau
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
