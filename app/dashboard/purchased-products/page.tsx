import Link from "next/link"
import { Boxes, Gamepad2, Server, Signal } from "lucide-react"
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
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { getPurchasedProducts } from "@/features/account/services/get-purchased-products"

const domainPresentation = {
  INFRASTRUCTURE: {
    title: "Hạ tầng",
    icon: Server,
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  DIGITAL_GOODS: {
    title: "Digital goods",
    icon: Gamepad2,
    tone: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  TELECOM: {
    title: "Telecom",
    icon: Signal,
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
} as const

export default async function DashboardPurchasedProductsPage() {
  const session = await getAuthSession()
  const purchasedProducts = await getPurchasedProducts(session?.user?.id ?? "")

  if (purchasedProducts.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/95">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Boxes className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Chưa có sản phẩm đã mua</EmptyTitle>
          <EmptyDescription>
            Khi đơn hàng hoàn tất, dịch vụ hoặc digital goods của bạn sẽ được nhóm lại tại đây
            để tiện quản lý vòng đời sau mua.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/services">Mở catalog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">Xem đơn hàng</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(domainPresentation).map(([domain, presentation]) => {
          const items = purchasedProducts.filter((product) => product.domain === domain)

          return (
            <Card key={domain} className="border-border/80 bg-card/95">
              <CardHeader className="space-y-2 pb-3">
                <CardDescription>{presentation.title}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <presentation.icon className="size-5 text-foreground" />
                  {items.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {items.length > 0
                  ? `Sản phẩm gần nhất được mua ${formatDateTime(items[0].lastPurchasedAt)}.`
                  : "Chưa có dữ liệu trong nhóm này."}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {purchasedProducts.map((product) => {
          const presentation = domainPresentation[product.domain as keyof typeof domainPresentation] ?? domainPresentation.DIGITAL_GOODS

          return (
            <Card
              key={product.productId}
              className="border-border/80 bg-card/95 shadow-[0_24px_60px_-46px_rgba(14,165,233,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription>
                      {product.totalQuantity} lượt mua • {product.orderCount} đơn hoàn tất
                    </CardDescription>
                  </div>
                  <Badge className={presentation.tone} variant="outline">
                    {presentation.title}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tổng chi tiêu</p>
                      <p className="mt-2 text-lg font-semibold">{product.totalSpentLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lần mua gần nhất</p>
                      <p className="mt-2 text-sm font-medium">{formatDateTime(product.lastPurchasedAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Danh mục này là nền để phase sau hiển thị thông tin vận hành sâu hơn như access,
                    key/card delivery hoặc lifecycle của dịch vụ đã mua.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link href={`/services/${product.slug}`}>Xem lại sản phẩm</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/purchased-products/${product.productId}`}>Chi tiết hậu mua</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/orders">Theo dõi đơn hàng</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
