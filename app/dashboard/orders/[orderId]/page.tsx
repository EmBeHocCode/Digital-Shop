import Link from "next/link"
import { Boxes, CalendarDays, CreditCard, ReceiptText } from "lucide-react"
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
import { ConfigurationSummaryCard } from "@/features/dashboard/components/configuration-summary-card"
import { DetailMetadataCard } from "@/features/dashboard/components/detail-metadata-card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import { PricingBreakdownCard } from "@/features/dashboard/components/pricing-breakdown-card"
import {
  getOrderStatusPresentation,
  getPaymentStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getUserOrderById } from "@/features/orders/services/get-user-orders"
import { getPaymentMethodLabel, getPaymentProviderLabel } from "@/features/payment/utils"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"

interface DashboardOrderDetailPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default async function DashboardOrderDetailPage({
  params,
}: DashboardOrderDetailPageProps) {
  const { orderId } = await params
  const session = await getAuthSession()
  const order = await getUserOrderById(session?.user?.id ?? "", orderId)

  if (!order) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/95">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Không tìm thấy đơn hàng</EmptyTitle>
          <EmptyDescription>
            Đơn hàng này không tồn tại hoặc không thuộc về tài khoản hiện tại.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard/orders">Quay lại danh sách đơn</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Mở catalog</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const orderStatus = getOrderStatusPresentation(order.status)
  const paymentStatus = getPaymentStatusPresentation(order.paymentStatus)
  const pricingLines = order.items.map((item) => ({
    label: `${item.productName} x${item.quantity}`,
    value: item.totalPriceLabel,
  }))

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 bg-card/95 shadow-[0_28px_70px_-48px_rgba(14,165,233,0.35)]">
        <CardHeader className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <CardDescription>Order detail</CardDescription>
              <CardTitle className="text-3xl">
                {order.paymentReference ?? order.id}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Được tạo lúc {formatDateTime(order.createdAt)} và gắn trực tiếp vào tài khoản đăng nhập.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DetailStatusBadge label={orderStatus.label} tone={orderStatus.tone} />
              <DetailStatusBadge className={paymentStatus.className} label={paymentStatus.label} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/orders">Danh sách đơn</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">Billing</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng thanh toán</p>
            <p className="mt-2 text-2xl font-semibold">{order.totalAmountLabel}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Số dòng sản phẩm</p>
            <p className="mt-2 text-2xl font-semibold">{order.items.length}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Phương thức</p>
            <p className="mt-2 text-2xl font-semibold">{getPaymentMethodLabel(order.paymentMethod)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
        <div className="space-y-6">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="size-4 text-foreground" />
                Sản phẩm trong đơn
              </CardTitle>
              <CardDescription>
                Hiển thị các mục đã mua cùng cấu hình đã persist vào `OrderItem`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} đơn vị • {item.unitPriceLabel}/item
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">{item.totalPriceLabel}</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/services/${item.productSlug}`}>Xem lại sản phẩm</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ConfigurationSummaryCard
                      configuration={item.configuration}
                      description="Cấu hình đã lưu từ checkout sẽ được dùng để đối soát hậu mua."
                      emptyText="Mục này dùng cấu hình mặc định của catalog, không có selection riêng."
                      title="Cấu hình sản phẩm"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Transaction liên quan</CardTitle>
              <CardDescription>
                Giao dịch được tạo cùng order để chuẩn bị cho provider và đối soát thanh toán.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.transactions.length > 0 ? (
                order.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {transaction.reference ?? transaction.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type} • {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <DetailStatusBadge
                          label={transaction.status}
                          tone={
                            transaction.status === "COMPLETED"
                              ? "success"
                              : transaction.status === "PENDING"
                                ? "warning"
                                : "danger"
                          }
                        />
                        <span className="text-sm font-semibold">{transaction.amountLabel}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Chưa có transaction detail nào được ghi nhận cho đơn hàng này.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <PricingBreakdownCard
            description="Hiện tại đơn hàng dùng subtotal và total giống nhau vì chưa có fee riêng."
            lines={pricingLines}
            title="Pricing breakdown"
            totalValue={order.totalAmountLabel}
            footer={
              <ul className="space-y-2">
                {order.paymentInstructions.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            }
          />

          <DetailMetadataCard
            title="Thông tin thanh toán"
            description="Các trường này đã persist ở cấp order để phục vụ đối soát và customer support."
            items={[
              {
                label: "Phương thức",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </span>
                ),
              },
              {
                label: "Provider",
                value: getPaymentProviderLabel(order.paymentProvider),
              },
              {
                label: "Mã thanh toán",
                value: order.paymentReference ?? "Chưa có",
              },
              {
                label: "Trạng thái payment",
                value: (
                  <DetailStatusBadge
                    className={paymentStatus.className}
                    label={paymentStatus.label}
                  />
                ),
              },
            ]}
          />

          <DetailMetadataCard
            title="Khách hàng & mốc thời gian"
            items={[
              {
                label: "Khách hàng",
                value: order.customerName || "Chưa cập nhật",
              },
              {
                label: "Email",
                value: order.customerEmail || "Chưa cập nhật",
              },
              {
                label: "Số điện thoại",
                value: order.customerPhone || "Chưa cập nhật",
              },
              {
                label: "Tạo lúc",
                value: (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {formatDateTime(order.createdAt)}
                  </span>
                ),
              },
              {
                label: "Cập nhật gần nhất",
                value: formatDateTime(order.updatedAt),
              },
              {
                fullWidth: true,
                label: "Ghi chú checkout",
                value: order.note || "Không có ghi chú bổ sung.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
