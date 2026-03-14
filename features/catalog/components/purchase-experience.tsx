"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Minus, Plus, Search, ShoppingCart, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PurchaseServiceSnapshot {
  slug: string
  name: string
  price: string
  priceValue: number
  category: string
}
import {
  createDefaultPurchaseSelection,
  getProductPurchaseExperience,
  resolveProductPurchase,
  type BillingCycleOption,
  type DenominationOption,
  type PurchaseSelection,
  type SimNumberOption,
} from "@/features/catalog/product-purchase"
import { getCartProduct } from "@/features/cart/utils/get-cart-product"
import { useCartStore } from "@/store/use-cart-store"

interface PurchaseExperienceProps {
  service: PurchaseServiceSnapshot
}

function getFirstMatchingSimNumberId(
  options: readonly SimNumberOption[],
  providerId: string,
  categoryId: string
) {
  return (
    options.find(
      (number) => number.providerId === providerId && number.categoryId === categoryId
    )?.id ?? ""
  )
}

interface OptionGridProps<TOption extends { id: string; label: string; description?: string; badge?: string }> {
  label: string
  options: readonly TOption[]
  value: string
  onChange: (value: string) => void
}

function OptionGrid<TOption extends { id: string; label: string; description?: string; badge?: string }>({
  label,
  options,
  value,
  onChange,
}: OptionGridProps<TOption>) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = option.id === value

          return (
            <button
              key={option.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                isActive
                  ? "border-foreground/20 bg-foreground/[0.05] shadow-[0_18px_42px_-28px_rgba(15,23,42,0.55)]"
                  : "border-border/80 bg-muted/20 hover:border-foreground/15 hover:bg-muted/40"
              )}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{option.label}</p>
                  {option.description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                  ) : null}
                </div>
                {isActive ? <Check className="mt-0.5 size-4 text-foreground" /> : null}
              </div>
              {option.badge ? (
                <Badge className="mt-3 border border-border/70 bg-background/70 text-foreground" variant="outline">
                  {option.badge}
                </Badge>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CycleGrid({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly BillingCycleOption[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Chu kỳ thanh toán</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isActive = option.id === value

          return (
            <button
              key={option.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                isActive
                  ? "border-foreground/20 bg-foreground/[0.05] shadow-[0_18px_42px_-28px_rgba(15,23,42,0.55)]"
                  : "border-border/80 bg-muted/20 hover:border-foreground/15 hover:bg-muted/40"
              )}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <div className="space-y-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.months} chu kỳ thanh toán</p>
              </div>
              {option.savings ? (
                <Badge className="mt-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" variant="outline">
                  {option.savings}
                </Badge>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuantityControl({
  value,
  onChange,
  max,
}: {
  value: number
  onChange: (value: number) => void
  max: number
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Số lượng</p>
      <div className="flex items-center gap-3">
        <Button disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))} size="icon-sm" type="button" variant="outline">
          <Minus className="size-4" />
        </Button>
        <div className="inline-flex min-w-14 items-center justify-center rounded-xl border border-border/80 bg-muted/20 px-4 py-2 text-sm font-semibold">
          {value}
        </div>
        <Button disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} size="icon-sm" type="button" variant="outline">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function DenominationGrid({
  options,
  value,
  onChange,
}: {
  options: readonly DenominationOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Mệnh giá</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = option.id === value

          return (
            <button
              key={option.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                isActive
                  ? "border-foreground/20 bg-foreground/[0.05] shadow-[0_18px_42px_-28px_rgba(15,23,42,0.55)]"
                  : "border-border/80 bg-muted/20 hover:border-foreground/15 hover:bg-muted/40"
              )}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <p className="font-medium">{option.label}</p>
              {option.note ? <p className="mt-1 text-sm text-muted-foreground">{option.note}</p> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SimNumberPicker({
  numbers,
  value,
  onChange,
}: {
  numbers: SimNumberOption[]
  value: string
  onChange: (value: string) => void
}) {
  if (numbers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
        Chưa có số phù hợp với bộ lọc hiện tại.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {numbers.map((number) => {
        const isActive = number.id === value

        return (
          <button
            key={number.id}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
              isActive
                ? "border-foreground/20 bg-foreground/[0.05] shadow-[0_18px_42px_-28px_rgba(15,23,42,0.55)]"
                : "border-border/80 bg-muted/20 hover:border-foreground/15 hover:bg-muted/40"
            )}
            onClick={() => onChange(number.id)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium tracking-[0.08em]">{number.value}</p>
              {isActive ? <Check className="size-4 text-foreground" /> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{number.tags.join(" • ")}</p>
          </button>
        )
      })}
    </div>
  )
}

export function PurchaseExperience({ service }: PurchaseExperienceProps) {
  const experience = getProductPurchaseExperience(service.slug)
  const [selection, setSelection] = useState<PurchaseSelection | null>(() =>
    createDefaultPurchaseSelection(service.slug)
  )
  const [numberSearch, setNumberSearch] = useState("")
  const upsertItem = useCartStore((state) => state.upsertItem)

  const resolved = useMemo(
    () =>
      resolveProductPurchase(
        {
          slug: service.slug,
          name: service.name,
          priceValue: service.priceValue,
          priceLabel: service.price,
          category: service.category,
        },
        selection
      ),
    [selection, service]
  )

  if (!experience || !selection) {
    return (
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>Thêm nhanh gói mặc định</CardTitle>
          <CardDescription>
            Dùng flow mua nhanh khi bạn chưa cần cấu hình chi tiết cho dịch vụ này.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Mức giá</p>
            <p className="mt-2 text-2xl font-semibold">{service.price}</p>
          </div>
          <Button
            className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            onClick={() => {
              const entry = getCartProduct(service)
              upsertItem(entry.product, entry.quantity)
              toast({
                title: "Đã thêm bản mặc định",
                description: `${service.name} đã được đưa vào giỏ hàng.`,
              })
            }}
            size="lg"
            type="button"
          >
            <ShoppingCart className="size-4" />
            Thêm vào giỏ hàng
          </Button>
        </CardContent>
      </Card>
    )
  }

  const filteredNumbers =
    experience.kind === "sim" && selection.kind === "sim"
      ? experience.availableNumbers.filter((number: SimNumberOption) => {
          const sameScope =
            number.providerId === selection.provider &&
            number.categoryId === selection.category
          const matchesSearch =
            !numberSearch.trim() ||
            number.value.replace(/\s+/g, "").includes(numberSearch.replace(/\s+/g, ""))

          return sameScope && matchesSearch
        })
      : []

  const isActionDisabled =
    selection.kind === "topup" ? selection.phoneNumber.trim().length < 9 : selection.kind === "sim" ? !selection.numberId : false

  const handleAddToCart = () => {
    const entry = getCartProduct(service, selection)
    upsertItem(entry.product, entry.quantity)
    toast({
      title: "Đã lưu cấu hình vào giỏ",
      description: `${service.name} đã được cập nhật theo lựa chọn mới nhất.`,
    })
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-28">
      <Card className="overflow-hidden border-border/80 bg-card/95">
        <CardHeader className="space-y-4 border-b border-border/70">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className="gap-2 border-border/80 bg-muted/30">
                <Sparkles className="size-3.5" />
                Product configurator
              </Badge>
              <div className="space-y-1">
                <CardTitle className="text-xl">{experience.headline}</CardTitle>
                <CardDescription className="leading-relaxed">{experience.description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {selection.kind === "infrastructure" && experience.kind === "infrastructure" ? (
            <>
              <OptionGrid label="CPU" onChange={(cpu) => setSelection({ ...selection, cpu })} options={experience.cpuOptions} value={selection.cpu} />
              <OptionGrid label="RAM" onChange={(ram) => setSelection({ ...selection, ram })} options={experience.ramOptions} value={selection.ram} />
              <OptionGrid
                label="Lưu trữ"
                onChange={(storage) => setSelection({ ...selection, storage })}
                options={experience.storageOptions}
                value={selection.storage}
              />
              <OptionGrid
                label="Khu vực triển khai"
                onChange={(region) => setSelection({ ...selection, region })}
                options={experience.regionOptions}
                value={selection.region}
              />
              <OptionGrid label="Hệ điều hành" onChange={(os) => setSelection({ ...selection, os })} options={experience.osOptions} value={selection.os} />
              <CycleGrid onChange={(cycle) => setSelection({ ...selection, cycle })} options={experience.cycleOptions} value={selection.cycle} />
            </>
          ) : null}

          {selection.kind === "digital_goods" && experience.kind === "digital_goods" ? (
            <>
              <OptionGrid label="Thương hiệu / provider" onChange={(brand) => setSelection({ ...selection, brand })} options={experience.brandOptions} value={selection.brand} />
              <DenominationGrid onChange={(denomination) => setSelection({ ...selection, denomination })} options={experience.denominationOptions} value={selection.denomination} />
              <QuantityControl max={experience.maxQuantity} onChange={(quantity) => setSelection({ ...selection, quantity })} value={selection.quantity} />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ghi chú giao hàng</p>
                <Textarea
                  onChange={(event) => setSelection({ ...selection, deliveryNote: event.target.value })}
                  placeholder="Ví dụ: cần giao vào email riêng, cần ưu tiên mã cho chiến dịch tặng quà..."
                  rows={4}
                  value={selection.deliveryNote}
                />
              </div>
            </>
          ) : null}

          {selection.kind === "sim" && experience.kind === "sim" ? (
            <>
              <OptionGrid
                label="Nhà mạng"
                onChange={(provider) =>
                  setSelection({
                    ...selection,
                    provider,
                    numberId: getFirstMatchingSimNumberId(
                      experience.availableNumbers,
                      provider,
                      selection.category
                    ),
                  })
                }
                options={experience.providerOptions}
                value={selection.provider}
              />
              <OptionGrid
                label="Nhóm số"
                onChange={(category) =>
                  setSelection({
                    ...selection,
                    category,
                    numberId: getFirstMatchingSimNumberId(
                      experience.availableNumbers,
                      selection.provider,
                      category
                    ),
                  })
                }
                options={experience.categoryOptions}
                value={selection.category}
              />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Tìm nhanh số</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setNumberSearch(event.target.value)}
                    placeholder="Lọc theo dãy số"
                    value={numberSearch}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Kho số khả dụng</p>
                <SimNumberPicker numbers={filteredNumbers} onChange={(numberId) => setSelection({ ...selection, numberId })} value={selection.numberId} />
              </div>
            </>
          ) : null}

          {selection.kind === "topup" && experience.kind === "topup" ? (
            <>
              <OptionGrid label="Nhà mạng" onChange={(carrier) => setSelection({ ...selection, carrier })} options={experience.carrierOptions} value={selection.carrier} />
              <DenominationGrid onChange={(denomination) => setSelection({ ...selection, denomination })} options={experience.denominationOptions} value={selection.denomination} />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Số điện thoại cần nạp</p>
                <Input
                  inputMode="numeric"
                  onChange={(event) => setSelection({ ...selection, phoneNumber: event.target.value.replace(/\D/g, "") })}
                  placeholder="0912345678"
                  value={selection.phoneNumber}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-[0_24px_60px_-42px_rgba(14,165,233,0.45)]">
        <CardHeader className="space-y-3">
          <CardTitle>Tóm tắt cấu hình</CardTitle>
          <CardDescription>{resolved.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ước tính thanh toán</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{resolved.totalPriceLabel}</p>
            {resolved.allowQuantityAdjustment ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {resolved.unitPriceLabel} / đơn vị • {resolved.quantity} đơn vị
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{resolved.unitPriceLabel} / cấu hình đã chọn</p>
            )}
          </div>

          <ul className="space-y-2">
            {resolved.summaryLines.map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-1 size-2 rounded-full bg-foreground/70" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-3">
            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              disabled={isActionDisabled}
              onClick={handleAddToCart}
              size="lg"
              type="button"
            >
              <ShoppingCart className="size-4" />
              {resolved.ctaLabel}
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" variant="outline">
                <Link href="/cart">Mở giỏ hàng</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/checkout">
                  Checkout
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Tại sao form này hữu ích?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cùng một product nhưng flow mua khác nhau: hạ tầng cần cấu hình, giftcard cần mệnh giá, còn telecom cần đúng số nhận hoặc kho số.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
