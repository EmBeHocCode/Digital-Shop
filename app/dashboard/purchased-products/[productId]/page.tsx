import Link from "next/link"
import { Boxes, CreditCard, Gift, ReceiptText, Server, Signal } from "lucide-react"
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
  getDeliveryStatusPresentation,
  getDomainPresentation,
  getOrderStatusPresentation,
  getPaymentStatusPresentation,
  getProvisionStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getPurchasedProductDetail } from "@/features/account/services/get-purchased-product-detail"
import { getPaymentMethodLabel, getPaymentProviderLabel } from "@/features/payment/utils"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"

interface DashboardPurchasedProductDetailPageProps {
  params: Promise<{
    productId: string
  }>
}

function formatJsonValue(value: unknown) {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default async function DashboardPurchasedProductDetailPage({
  params,
}: DashboardPurchasedProductDetailPageProps) {
  const { productId } = await params
  const session = await getAuthSession()
  const product = await getPurchasedProductDetail(session?.user?.id ?? "", productId)

  if (!product) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/95">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Boxes className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Không tìm thấy sản phẩm đã mua</EmptyTitle>
          <EmptyDescription>
            Mục này không tồn tại, chưa hoàn tất đơn hàng hoặc không thuộc về tài khoản hiện tại.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard/purchased-products">Quay lại danh sách</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">Mở orders</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const domain = getDomainPresentation(product.domain)
  const latestLineItem = product.lineItems[0] ?? null
  const latestProvision = latestLineItem?.serviceProvisions[0] ?? null
  const latestDelivery = latestLineItem?.digitalDeliveries[0] ?? null
  const latestOrderStatus = latestLineItem
    ? getOrderStatusPresentation(latestLineItem.orderStatus)
    : null
  const latestPaymentStatus = latestLineItem
    ? getPaymentStatusPresentation(latestLineItem.paymentStatus)
    : null
  const latestProvisionStatus = product.latestProvisionStatus
    ? getProvisionStatusPresentation(product.latestProvisionStatus)
    : null
  const latestDeliveryStatus = product.latestDeliveryStatus
    ? getDeliveryStatusPresentation(product.latestDeliveryStatus)
    : null
  const productDescription =
    product.tagline || product.description || "Thông tin hậu mua của sản phẩm sẽ được tập trung tại đây."
  const pricingLines = [
    { label: "Tổng lượt mua", value: `${product.totalQuantity} đơn vị` },
    { label: "Số đơn hoàn tất", value: `${product.orderCount} đơn` },
    {
      label: "Lần mua gần nhất",
      value: formatDateTime(product.lastPurchasedAt, { dateStyle: "medium" }),
    },
  ]
  const rawProvisionConfig = formatJsonValue(latestProvision?.config)
  const rawProvisionAccess = formatJsonValue(latestProvision?.accessData)
  const rawDeliveryPayload = formatJsonValue(latestDelivery?.payload)

  return (
    <div className="grid gap-6">
      <Card className="border-border/80 bg-card/95 shadow-[0_28px_70px_-48px_rgba(14,165,233,0.35)]">
        <CardHeader className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <CardDescription>Purchased product detail</CardDescription>
              <CardTitle className="text-3xl">{product.name}</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">{productDescription}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DetailStatusBadge className={domain.tone} label={domain.label} />
              {latestProvisionStatus ? (
                <DetailStatusBadge
                  label={latestProvisionStatus.label}
                  tone={latestProvisionStatus.tone}
                />
              ) : null}
              {latestDeliveryStatus ? (
                <DetailStatusBadge
                  label={latestDeliveryStatus.label}
                  tone={latestDeliveryStatus.tone}
                />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/purchased-products">Danh sách đã mua</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/services/${product.slug}`}>Xem lại sản phẩm</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng chi tiêu</p>
            <p className="mt-2 text-2xl font-semibold">{product.totalSpentLabel}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lần mua gần nhất</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatDateTime(product.lastPurchasedAt, { dateStyle: "medium" })}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Số line item</p>
            <p className="mt-2 text-2xl font-semibold">{product.lineItems.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
        <div className="space-y-6">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {product.domain === "INFRASTRUCTURE" ? (
                  <Server className="size-4 text-foreground" />
                ) : product.domain === "TELECOM" ? (
                  <Signal className="size-4 text-foreground" />
                ) : (
                  <Gift className="size-4 text-foreground" />
                )}
                {product.domain === "INFRASTRUCTURE" ? "Trạng thái dịch vụ" : "Delivery & thực thi"}
              </CardTitle>
              <CardDescription>
                Tập trung trạng thái provisioning hoặc delivery mới nhất cho sản phẩm đã hoàn tất thanh toán.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.domain === "INFRASTRUCTURE" ? (
                latestProvision ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {latestProvision.providerKey || "Provisioning nội bộ"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {latestProvision.region || "Chưa có region cụ thể"} • Cập nhật{" "}
                          {formatDateTime(latestProvision.updatedAt)}
                        </p>
                      </div>
                      <DetailStatusBadge
                        label={latestProvisionStatus?.label || latestProvision.status}
                        tone={latestProvisionStatus?.tone}
                      />
                    </div>
                    <DetailMetadataCard
                      title="Thông tin lifecycle"
                      items={[
                        {
                          label: "Region",
                          value: latestProvision.region || "Chưa có",
                        },
                        {
                          label: "Provisioned lúc",
                          value: latestProvision.provisionedAt
                            ? formatDateTime(latestProvision.provisionedAt)
                            : "Chưa provisioned",
                        },
                        {
                          label: "Provider key",
                          value: latestProvision.providerKey || "Nội bộ",
                        },
                        {
                          fullWidth: true,
                          label: "Config đã lưu",
                          value: rawProvisionConfig ? (
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-background/80 p-3 text-xs">
                              {rawProvisionConfig}
                            </pre>
                          ) : (
                            "Chưa có payload cấu hình."
                          ),
                        },
                        {
                          fullWidth: true,
                          label: "Access data",
                          value: rawProvisionAccess ? (
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-background/80 p-3 text-xs">
                              {rawProvisionAccess}
                            </pre>
                          ) : (
                            "Chưa có dữ liệu truy cập."
                          ),
                        },
                      ]}
                    />
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    Chưa có bản ghi provisioning nào cho sản phẩm này. Khi luồng vận hành hạ tầng được nối,
                    thông tin service lifecycle sẽ hiển thị tại đây.
                  </div>
                )
              ) : latestDelivery ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {latestDelivery.channel || "Kênh giao hàng nội bộ"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {latestDelivery.deliveredAt
                          ? `Đã giao ${formatDateTime(latestDelivery.deliveredAt)}`
                          : `Cập nhật ${formatDateTime(latestDelivery.updatedAt)}`}
                      </p>
                    </div>
                    <DetailStatusBadge
                      label={latestDeliveryStatus?.label || latestDelivery.status}
                      tone={latestDeliveryStatus?.tone}
                    />
                  </div>
                  <DetailMetadataCard
                    title="Delivery record mới nhất"
                    items={[
                      {
                        label: "Kênh giao hàng",
                        value: latestDelivery.channel || "Nội bộ",
                      },
                      {
                        label: "Delivered lúc",
                        value: latestDelivery.deliveredAt
                          ? formatDateTime(latestDelivery.deliveredAt)
                          : "Chưa giao xong",
                      },
                      {
                        label: "Cập nhật gần nhất",
                        value: formatDateTime(latestDelivery.updatedAt),
                      },
                      {
                        fullWidth: true,
                        label: "Payload",
                        value: rawDeliveryPayload ? (
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-background/80 p-3 text-xs">
                            {rawDeliveryPayload}
                          </pre>
                        ) : (
                          "Chưa có payload giao hàng."
                        ),
                      },
                    ]}
                  />
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Chưa có delivery record nào cho sản phẩm này. Với giftcard, game cards hoặc telecom,
                  thông tin phát hành và giao hàng sẽ hiển thị ở đây.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="size-4 text-foreground" />
                Lịch sử mua và hậu mua
              </CardTitle>
              <CardDescription>
                Từng line item đã hoàn tất, liên kết trực tiếp về order detail tương ứng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.lineItems.map((item) => {
                const orderStatus = getOrderStatusPresentation(item.orderStatus)
                const paymentStatus = getPaymentStatusPresentation(item.paymentStatus)
                const provisionStatus = item.serviceProvisions[0]
                  ? getProvisionStatusPresentation(item.serviceProvisions[0].status)
                  : null
                const deliveryStatus = item.digitalDeliveries[0]
                  ? getDeliveryStatusPresentation(item.digitalDeliveries[0].status)
                  : null

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} đơn vị • {item.totalPriceLabel} • {formatDateTime(item.orderCreatedAt)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <DetailStatusBadge label={orderStatus.label} tone={orderStatus.tone} />
                          <DetailStatusBadge
                            className={paymentStatus.className}
                            label={paymentStatus.label}
                          />
                          {provisionStatus ? (
                            <DetailStatusBadge
                              label={provisionStatus.label}
                              tone={provisionStatus.tone}
                            />
                          ) : null}
                          {deliveryStatus ? (
                            <DetailStatusBadge
                              label={deliveryStatus.label}
                              tone={deliveryStatus.tone}
                            />
                          ) : null}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/orders/${item.orderId}`}>Mở order</Link>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <ConfigurationSummaryCard
                        configuration={item.configuration}
                        description="Cấu hình đã persist từ order item."
                        emptyText="Mục này không có selection riêng đã lưu."
                        title="Cấu hình line item"
                      />
                      <DetailMetadataCard
                        title="Payment snapshot"
                        items={[
                          {
                            label: "Mã đơn",
                            value: item.orderReference || item.orderId,
                          },
                          {
                            label: "Phương thức",
                            value: (
                              <span className="inline-flex items-center gap-2">
                                <CreditCard className="size-4 text-muted-foreground" />
                                {getPaymentMethodLabel(item.paymentMethod)}
                              </span>
                            ),
                          },
                          {
                            label: "Provider",
                            value: getPaymentProviderLabel(item.paymentProvider),
                          },
                          {
                            label: "Tổng line",
                            value: item.totalPriceLabel,
                          },
                        ]}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <ConfigurationSummaryCard
            configuration={product.latestConfiguration}
            description="Selection mới nhất đang được xem như cấu hình tham chiếu hậu mua."
            emptyText="Sản phẩm này chưa có cấu hình selection được lưu."
            title="Cấu hình gần nhất"
          />

          <PricingBreakdownCard
            title="Commerce summary"
            description="Tổng hợp hành vi mua và mốc sử dụng gần nhất của sản phẩm."
            lines={pricingLines}
            totalLabel="Tổng chi tiêu luỹ kế"
            totalValue={product.totalSpentLabel}
            footer={
              latestLineItem ? (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    Order gần nhất: {latestLineItem.orderReference || latestLineItem.orderId}
                  </p>
                  <p>Trạng thái đơn: {latestOrderStatus?.label || latestLineItem.orderStatus}.</p>
                  <p>Payment: {latestPaymentStatus?.label || latestLineItem.paymentStatus}.</p>
                </div>
              ) : (
                "Chưa có line item hoàn tất nào."
              )
            }
          />

          <DetailMetadataCard
            title="Metadata sản phẩm"
            description="Thông tin dùng để hỗ trợ user-facing account pages và support."
            items={[
              {
                label: "Slug",
                value: product.slug,
              },
              {
                label: "Category",
                value: product.category,
              },
              {
                label: "Domain",
                value: domain.label,
              },
              {
                label: "Lần mua gần nhất",
                value: formatDateTime(product.lastPurchasedAt),
              },
              {
                label: "Provision status",
                value: latestProvisionStatus ? (
                  <DetailStatusBadge
                    label={latestProvisionStatus.label}
                    tone={latestProvisionStatus.tone}
                  />
                ) : (
                  "Chưa có"
                ),
              },
              {
                label: "Delivery status",
                value: latestDeliveryStatus ? (
                  <DetailStatusBadge
                    label={latestDeliveryStatus.label}
                    tone={latestDeliveryStatus.tone}
                  />
                ) : (
                  "Chưa có"
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
