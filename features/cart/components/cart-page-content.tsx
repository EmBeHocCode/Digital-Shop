"use client"

import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/store/use-cart-store"

export function CartPageContent() {
  const items = useCartStore((state) => state.items)
  const isHydrated = useCartStore((state) => state.isHydrated)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const subtotal = items.reduce((total, item) => total + item.priceValue * item.quantity, 0)

  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Cart flow
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Giỏ hàng của bạn
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            Phase 3 dùng cart store local để nối public catalog sang checkout mà chưa cần order backend hoàn chỉnh.
          </p>
        </div>

        {!isHydrated ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
                <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded-xl bg-muted/70" />
                <div className="h-10 animate-pulse rounded-xl bg-muted/70" />
              </CardContent>
            </Card>
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border/80 bg-card/90">
            <CardContent className="p-0">
              <Empty className="border-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShoppingCart className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Giỏ hàng đang trống</EmptyTitle>
                  <EmptyDescription>
                    Chọn dịch vụ từ catalog để bắt đầu checkout. Bạn có thể thêm VPS, Cloud Server, Giftcard hoặc các dịch vụ telecom.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link href="/services">Khám phá catalog</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Quay lại landing</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="border-border/80 bg-card/90">
                  <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold">{item.name}</h2>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {item.tagline}
                      </p>
                      {item.configuration ? (
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Cấu hình đã chọn
                          </p>
                          <p className="mt-2 font-medium">{item.configuration.title}</p>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {item.configuration.summaryLines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Đơn giá: {formatCurrency(item.priceValue)}</span>
                        <Link
                          href={`/services/${item.slug}`}
                          className="font-medium text-foreground transition-colors hover:text-foreground/80"
                        >
                          Xem lại chi tiết
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:items-end">
                      <p className="text-lg font-semibold">
                        {formatCurrency(item.priceValue * item.quantity)}
                      </p>
                      {item.configuration?.allowQuantityAdjustment === false ? (
                        <span className="inline-flex min-w-10 items-center justify-center rounded-md border border-border px-3 py-1 text-sm font-medium">
                          {item.quantity} cấu hình
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            aria-label={`Giảm số lượng ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            size="icon-sm"
                            type="button"
                            variant="outline"
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="inline-flex min-w-10 items-center justify-center rounded-md border border-border px-3 py-1 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            aria-label={`Tăng số lượng ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            size="icon-sm"
                            type="button"
                            variant="outline"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        onClick={() => removeItem(item.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit border-border/80 bg-card/95 lg:sticky lg:top-28">
              <CardHeader className="space-y-3">
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
                <CardDescription>
                  {items.length} sản phẩm trong giỏ hàng, sẵn sàng đi tiếp sang checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phí thanh toán</span>
                    <span className="font-medium">Chưa áp dụng</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    size="lg"
                  >
                    <Link href="/checkout">Tiếp tục checkout</Link>
                  </Button>
                  <Button asChild className="w-full" size="lg" variant="outline">
                    <Link href="/services">Thêm dịch vụ khác</Link>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={clearCart}
                    size="lg"
                    type="button"
                    variant="ghost"
                  >
                    Xóa toàn bộ giỏ hàng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
