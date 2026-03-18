"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { topupChannelOptions, topupPaymentOptions } from "@/features/payment/constants"
import { cn, formatCurrency } from "@/lib/utils"
import {
  getTopupChannelLabel,
  getTopupChannelPreview,
} from "@/features/payment/services/sepay-topup"
import {
  createTopupRequestSchema,
  type CreateTopupRequestInput,
} from "@/features/wallet/validations"
import type { CreatedTopupRequest } from "@/features/wallet/services/create-topup-request"

interface TopupRequestFormProps {
  title?: string
  description?: string
}

export function TopupRequestForm({
  title = "Tạo yêu cầu nạp ví",
  description = "Luồng này tạo transaction `TOPUP` ở trạng thái pending để sẵn sàng nối payment provider thật sau này.",
}: TopupRequestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [topupResult, setTopupResult] = useState<CreatedTopupRequest | null>(null)
  const form = useForm<CreateTopupRequestInput>({
    resolver: zodResolver(createTopupRequestSchema),
    defaultValues: {
      amount: 100000,
      paymentMethod: "bank_transfer",
      paymentChannel: "manual_bank_transfer",
      note: "",
    },
  })
  const selectedMethod =
    useWatch({
      control: form.control,
      name: "paymentMethod",
    }) ?? "bank_transfer"
  const selectedChannel =
    useWatch({
      control: form.control,
      name: "paymentChannel",
    }) ?? "manual_bank_transfer"
  const topupChannelPreview = getTopupChannelPreview(selectedChannel)

  const handleSubmit = (values: CreateTopupRequestInput) => {
    setFormError(null)

    startTransition(async () => {
      const response = await fetch("/api/wallet/topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            message?: string
            topupRequest?: CreatedTopupRequest
          }
        | null

      if (!response.ok || !payload?.success || !payload.topupRequest) {
        setFormError(payload?.message ?? "Không thể tạo yêu cầu nạp ví.")
        return
      }

      setTopupResult(payload.topupRequest)
      form.reset({
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentChannel: values.paymentChannel,
        note: "",
      })
      router.refresh()
    })
  }

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {formError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Không thể tạo yêu cầu</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {topupResult ? (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Đã tạo yêu cầu nạp ví</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Mã tham chiếu <span className="font-semibold">{topupResult.reference}</span> với số
                tiền {formatCurrency(topupResult.amount)} đã được ghi nhận.
              </p>
              <p>Kênh đã chọn: {getTopupChannelLabel(topupResult.paymentChannel)}</p>
              <div className="space-y-1">
                {topupResult.instructions.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền nạp</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      min={10000}
                      step={10000}
                      type="number"
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
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
                  <FormLabel>Phương thức nạp ví</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="grid gap-3"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      {topupPaymentOptions.map((option) => (
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

            {selectedMethod === "bank_transfer" ? (
              <FormField
                control={form.control}
                name="paymentChannel"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Kênh chuyển khoản</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="grid gap-3"
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        {topupChannelOptions.map((option) => (
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
                                {option.badge ? (
                                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                                    {option.badge}
                                  </span>
                                ) : null}
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
            ) : null}

            {selectedMethod === "bank_transfer" ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                    <QrCode className="size-4" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{topupChannelPreview.title}</p>
                      {topupChannelPreview.badge ? (
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {topupChannelPreview.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {topupChannelPreview.description}
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {topupChannelPreview.details.map((detail) => (
                        <p key={detail}>{detail}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ví dụ: cần đối soát nhanh, cần xuất hóa đơn, ghi chú cho bộ phận thanh toán..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              disabled={isPending}
              size="lg"
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang tạo yêu cầu
                </>
              ) : (
                "Tạo yêu cầu nạp ví"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
