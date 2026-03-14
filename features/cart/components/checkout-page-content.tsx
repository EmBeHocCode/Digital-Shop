"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { Info, Loader2, Wallet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { checkoutPaymentOptions } from "@/features/payment/constants"
import { checkoutSchema, type CheckoutInput } from "@/features/cart/validations"
import { cn, formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/store/use-cart-store"

export function CheckoutPageContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const hasPrefilledRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const items = useCartStore((state) => state.items)
  const isHydrated = useCartStore((state) => state.isHydrated)
  const completeOrder = useCartStore((state) => state.completeOrder)
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.priceValue * item.quantity, 0),
    [items]
  )

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      note: "",
      paymentMethod: "manual_confirmation",
    },
  })

  useEffect(() => {
    if (!session?.user || hasPrefilledRef.current) {
      return
    }

    form.reset({
      ...form.getValues(),
      name: form.getValues("name") || session.user.name || "",
      email: form.getValues("email") || session.user.email || "",
    })
    hasPrefilledRef.current = true
  }, [form, session?.user])

  const handleSubmit = (values: CheckoutInput) => {
    setFormError(null)

    startTransition(async () => {
      if (!session?.user?.id) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`)
        return
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          items: items.map((item) => ({
            id: item.id,
            slug: item.slug,
            quantity: item.quantity,
            configuration: item.configuration?.selection,
          })),
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            message?: string
            order?: {
              id: string
              reference: string
              createdAt: string
              status: string
              paymentMethod: CheckoutInput["paymentMethod"]
              paymentProvider: "internal_wallet" | "manual_bank_transfer" | "manual_review"
              paymentStatus: "pending" | "succeeded" | "requires_action" | "failed"
              paymentInstructions: {
                title: string
                lines: string[]
              }
              customer: {
                name: string
                email: string
                phone?: string
                note?: string
              }
              items: typeof items
              currency: string
              subtotal: number
              total: number
            }
          }
        | null

      if (!response.ok || !payload?.success || !payload.order) {
        setFormError(payload?.message ?? "Không thể tạo đơn hàng lúc này.")
        return
      }

      completeOrder(payload.order)
      router.push(`/order/success?orderId=${encodeURIComponent(payload.order.id)}`)
      router.refresh()
    })
  }

  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:px-8">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Checkout
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Hoàn tất thông tin đơn hàng
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            Checkout hiện đã nối sang order backend thật. Khi xác nhận, hệ thống sẽ tạo
            `Order`, `OrderItem` và `Transaction` tương ứng.
          </p>
        </div>

        {!isHydrated ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-11 animate-pulse rounded-xl bg-muted/70" />
                <div className="h-11 animate-pulse rounded-xl bg-muted/70" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted/70" />
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted/70" />
              </CardContent>
            </Card>
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border/80 bg-card/90">
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
              <Wallet className="size-10 text-foreground" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Chưa có sản phẩm để checkout</h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Bạn cần thêm ít nhất một dịch vụ vào giỏ hàng trước khi hoàn tất checkout.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/services">Đi tới catalog</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cart">Xem lại giỏ hàng</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-border/80 bg-card/95">
              <CardHeader className="space-y-3">
                <CardTitle>Thông tin khách hàng</CardTitle>
                <CardDescription>
                  Order sẽ được gắn với tài khoản đang đăng nhập và tạo transaction theo phương
                  thức thanh toán bạn chọn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formError ? (
                  <Alert variant="destructive">
                    <Info className="size-4" />
                    <AlertTitle>Không thể tạo đơn hàng</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="size-4" />
                    <AlertTitle>Payment foundation</AlertTitle>
                    <AlertDescription>
                      Wallet payment sẽ trừ số dư atomically. Bank transfer và manual confirmation
                      giữ đơn ở trạng thái pending để sẵn sàng cho gateway thật trong phase sau.
                    </AlertDescription>
                  </Alert>
                )}

                {!session?.user?.id ? (
                  <Alert>
                    <Wallet className="size-4" />
                    <AlertTitle>Cần đăng nhập để đặt hàng</AlertTitle>
                    <AlertDescription>
                      Cart vẫn được giữ local, nhưng order thật chỉ được tạo cho tài khoản đã đăng
                      nhập.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Form {...form}>
                  <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                              <Input {...field} autoComplete="name" placeholder="Nguyễn Văn A" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="email"
                                placeholder="you@example.com"
                                type="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="tel" placeholder="0989 123 456" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Phương thức thanh toán</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="grid gap-3"
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              {checkoutPaymentOptions.map((option) => (
                                <label
                                  key={option.value}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors",
                                    field.value === option.value
                                      ? "border-foreground/15 bg-foreground/[0.04] shadow-sm"
                                      : "border-border/80 bg-muted/20 hover:border-foreground/15"
                                  )}
                                >
                                  <RadioGroupItem className="mt-1" value={option.value} />
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <option.icon className="size-4 text-foreground" />
                                      <span className="font-medium">{option.title}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                      {option.description}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú đơn hàng</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Ví dụ: cần xuất hóa đơn, cần hỗ trợ kích hoạt nhanh, ghi chú xử lý..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {session?.user?.id ? (
                        <Button
                          className="sm:flex-1 bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                          disabled={isPending}
                          size="lg"
                          type="submit"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Đang xác nhận
                            </>
                          ) : (
                            "Tạo đơn hàng"
                          )}
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="sm:flex-1 bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                          size="lg"
                        >
                          <Link href="/login?callbackUrl=%2Fcheckout">Đăng nhập để đặt hàng</Link>
                        </Button>
                      )}
                      <Button asChild className="sm:flex-1" size="lg" variant="outline">
                        <Link href="/cart">Quay lại giỏ hàng</Link>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="h-fit border-border/80 bg-card/95 lg:sticky lg:top-28">
              <CardHeader className="space-y-3">
                <CardTitle>Tóm tắt thanh toán</CardTitle>
                <CardDescription>
                  {items.length} sản phẩm được lấy trực tiếp từ cart state hiện tại.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        {item.configuration ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{item.configuration.title}</p>
                            {item.configuration.summaryLines.slice(0, 2).map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        ) : null}
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.priceValue)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.priceValue * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Khuyến mãi</span>
                    <span>Chưa áp dụng</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {session?.user?.email
                      ? `Checkout đang được điền sẵn theo tài khoản ${session.user.email}.`
                      : "Đăng nhập trước khi xác nhận để đơn hàng được gắn với tài khoản của bạn."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
