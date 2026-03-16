import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminOrderActions } from "@/features/admin/components/admin-order-actions"
import { getAdminOrderById } from "@/features/admin/services/get-admin-orders"
import { ConfigurationSummaryCard } from "@/features/dashboard/components/configuration-summary-card"
import { DetailMetadataCard } from "@/features/dashboard/components/detail-metadata-card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import { PricingBreakdownCard } from "@/features/dashboard/components/pricing-breakdown-card"
import {
  getOrderStatusPresentation,
  getTransactionStatusPresentation,
  getTransactionTypePresentation,
} from "@/features/dashboard/detail-presenters"
import { getAuthSession } from "@/lib/auth"
import { canManageOrders } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminOrderDetailPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const session = await getAuthSession()

  if (!canManageOrders(session?.user?.role)) {
    redirect("/access-denied")
  }

  const { orderId } = await params
  const order = await getAdminOrderById(orderId)

  if (!order) {
    notFound()
  }

  const orderStatus = getOrderStatusPresentation(order.status)
  const paymentStatus = getTransactionStatusPresentation(order.paymentStatus)

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 bg-card/95 shadow-[0_26px_80px_-58px_rgba(14,165,233,0.35)]">
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <CardDescription>Admin order detail</CardDescription>
            <CardTitle className="text-3xl">{order.paymentReference ?? order.id}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <DetailStatusBadge label={orderStatus.label} tone={orderStatus.tone} />
              <DetailStatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
            </div>
            <p className="text-sm text-muted-foreground">
              Người mua: {order.customerName || order.userName} • {order.customerEmail || order.userEmail}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng tiền</p>
              <p className="text-2xl font-semibold">{order.totalAmountLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/admin/orders">Quay lại orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/dashboard/admin/users/${order.userId}`}>Mở user</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminOrderActions orderId={order.id} paymentStatus={order.paymentStatus} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-6">
          <DetailMetadataCard
            description="Dữ liệu khách hàng được dùng cho vận hành, đối soát và follow-up sau mua."
            items={[
              { label: "User ID", value: order.userId },
              { label: "Email đăng nhập", value: order.userEmail },
              { label: "Tên user", value: order.userName },
              { label: "Số điện thoại", value: order.userPhone || order.customerPhone || "Chưa cập nhật" },
              { label: "Customer name", value: order.customerName || "Chưa ghi riêng" },
              { label: "Customer email", value: order.customerEmail || "Chưa ghi riêng" },
            ]}
            title="Thông tin khách hàng"
          />

          <PricingBreakdownCard
            description="Tóm tắt thanh toán và giá trị đơn hàng theo dữ liệu order gốc."
            lines={[
              { label: "Phương thức", value: order.paymentMethod },
              { label: "Provider", value: order.paymentProvider },
              { label: "Ngày tạo", value: formatDateTime(order.createdAt) },
              { label: "Cập nhật", value: formatDateTime(order.updatedAt) },
            ]}
            title="Payment & timeline"
            totalValue={order.totalAmountLabel}
          />

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Danh sách items</CardTitle>
              <CardDescription>
                Bao gồm cấu hình đã persist trong `OrderItem.metadata` khi có.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.productName}</p>
                        <DetailStatusBadge label={`Qty ${item.quantity}`} tone="info" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.productSlug}</p>
                    </div>
                    <div className="text-sm font-semibold">{item.totalPriceLabel}</div>
                  </div>
                  <div className="mt-4">
                    <ConfigurationSummaryCard configuration={item.configuration} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Payment, top-up, refund hoặc adjustment liên kết với order này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.transactions.length > 0 ? (
                order.transactions.map((transaction) => {
                  const status = getTransactionStatusPresentation(transaction.status)
                  const type = getTransactionTypePresentation(transaction.type)

                  return (
                    <div
                      key={transaction.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <DetailStatusBadge label={type.label} tone={type.tone} />
                        <DetailStatusBadge label={status.label} tone={status.tone} />
                      </div>
                      <p className="mt-3 text-sm font-semibold">{transaction.amountLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {transaction.reference ?? transaction.id}
                      </p>
                      {transaction.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{transaction.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Chưa có transaction nào gắn trực tiếp với order này.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Refund requests</CardTitle>
              <CardDescription>
                Foundation để review yêu cầu hoàn tiền trước khi nối provider thật.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.refundRequests.length > 0 ? (
                order.refundRequests.map((request) => {
                  const status = getTransactionStatusPresentation(
                    request.status === "APPROVED" || request.status === "COMPLETED"
                      ? "COMPLETED"
                      : request.status === "REJECTED" || request.status === "CANCELED"
                        ? "CANCELLED"
                        : "PENDING"
                  )

                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <DetailStatusBadge label={status.label} tone={status.tone} />
                      </div>
                      <p className="mt-3 font-medium">{request.amountLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Chưa có refund request nào cho order này.
                </div>
              )}
            </CardContent>
          </Card>

          {order.note ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Admin notes</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{order.note}</pre>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
