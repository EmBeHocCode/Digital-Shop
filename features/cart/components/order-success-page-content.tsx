"use client"

import Link from "next/link"
import { CheckCircle2, CreditCard, LayoutDashboard, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserOrderSummary } from "@/features/orders/services/get-user-orders"
import {
  getPaymentMethodLabel,
  getPaymentProviderLabel,
  getPaymentStatusClassName,
  getPaymentStatusLabel,
} from "@/features/payment/utils"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { useCartStore } from "@/store/use-cart-store"

interface OrderSuccessPageContentProps {
  order?: UserOrderSummary | null
}

export function OrderSuccessPageContent({ order }: OrderSuccessPageContentProps) {
  const lastOrder = useCartStore((state) => state.lastOrder)
  const isHydrated = useCartStore((state) => state.isHydrated)
  const currentOrder = order ?? lastOrder

  if (!order && !isHydrated) {
    return (
      <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Card className="border-border/80 bg-card/90">
            <CardContent className="space-y-4 p-8">
              <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Card className="border-border/80 bg-card/90">
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
              <ShoppingCart className="size-10 text-foreground" />
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Chưa có đơn hàng nào để hiển thị
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Hoàn tất checkout để tạo đơn hàng thật và trạng thái thanh toán tương ứng.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/services">Về catalog</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cart">Mở giỏ hàng</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const paymentMethodLabel = getPaymentMethodLabel(currentOrder.paymentMethod)
  const paymentProviderLabel =
    "paymentProvider" in currentOrder
      ? getPaymentProviderLabel(currentOrder.paymentProvider)
      : "Chưa xác định"
  const paymentStatusLabel =
    "paymentStatus" in currentOrder
      ? getPaymentStatusLabel(currentOrder.paymentStatus)
      : "Đã xác nhận"
  const paymentStatusClassName =
    "paymentStatus" in currentOrder
      ? getPaymentStatusClassName(currentOrder.paymentStatus)
      : getPaymentStatusClassName("succeeded")
  const customerName =
    "customer" in currentOrder ? currentOrder.customer.name : currentOrder.customerName
  const customerEmail =
    "customer" in currentOrder ? currentOrder.customer.email : currentOrder.customerEmail
  const customerNote =
    "customer" in currentOrder ? currentOrder.customer.note : currentOrder.note
  const orderReference =
    "reference" in currentOrder ? currentOrder.reference : currentOrder.paymentReference ?? currentOrder.id
  const totalLabel =
    "totalAmountLabel" in currentOrder
      ? currentOrder.totalAmountLabel
      : formatCurrency(currentOrder.total, currentOrder.currency)

  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 lg:px-8">
        <Card className="overflow-hidden border-border/80 bg-card/95">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit gap-2 border border-border bg-muted/60 text-foreground hover:bg-muted/60">
                  <CheckCircle2 className="size-4 text-foreground" />
                  Order created
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight">
                    {"paymentStatus" in currentOrder && currentOrder.paymentStatus === "succeeded"
                      ? "Đơn hàng đã được xác nhận"
                      : "Đơn hàng đã được tạo"}
                  </h1>
                  <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                    {"paymentInstructions" in currentOrder
                      ? currentOrder.paymentInstructions.lines[0]
                      : "Đơn hàng đã được lưu vào hệ thống và sẵn sàng cho bước thanh toán tiếp theo."}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Mã xác nhận
                </p>
                <p className="mt-2 text-lg font-semibold">{orderReference}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Khách hàng
                </p>
                <p className="mt-2 font-medium">{customerName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{customerEmail}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Thanh toán
                </p>
                <p className="mt-2 font-medium">{paymentMethodLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {paymentProviderLabel} • {paymentStatusLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Thời gian
                </p>
                <p className="mt-2 font-medium">{formatDateTime(currentOrder.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Tổng cộng
                  </p>
                  <p className="mt-2 text-xl font-semibold">{totalLabel}</p>
                </div>
                <Badge className={paymentStatusClassName} variant="outline">
                  {paymentStatusLabel}
                </Badge>
              </div>
              {"paymentInstructions" in currentOrder ? (
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {currentOrder.paymentInstructions.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Chi tiết sản phẩm</CardTitle>
              <CardDescription>
                Các item dưới đây được lấy từ order thật đã tạo hoặc local fallback vừa xác nhận.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{"name" in item ? item.name : item.productName}</p>
                    {item.configuration ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{item.configuration.title}</p>
                        {item.configuration.summaryLines.slice(0, 2).map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x{" "}
                      {"priceValue" in item
                        ? formatCurrency(item.priceValue)
                        : item.unitPriceLabel}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {"priceValue" in item
                      ? formatCurrency(item.priceValue * item.quantity)
                      : item.totalPriceLabel}
                  </p>
                </div>
              ))}

              {customerNote ? (
                <div className="rounded-2xl border border-dashed border-border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Ghi chú khách hàng
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {customerNote}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-fit border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Hành động tiếp theo</CardTitle>
              <CardDescription>
                Tiếp tục duyệt catalog hoặc mở dashboard để theo dõi đơn hàng và thanh toán.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                size="lg"
              >
                <Link href="/services">Tiếp tục mua dịch vụ</Link>
              </Button>
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/dashboard/orders">
                  <LayoutDashboard className="size-4" />
                  Xem đơn hàng trong dashboard
                </Link>
              </Button>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CreditCard className="size-4 text-foreground" />
                  Ghi chú triển khai
                </div>
                <p className="mt-2 leading-relaxed">
                  Flow này đã ghi `Order`, `OrderItem` và `Transaction` thật vào database. Local
                  state chỉ còn giữ vai trò fallback để UX không bị gãy khi điều hướng.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
