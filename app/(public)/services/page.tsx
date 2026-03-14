import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { CatalogGrid } from "@/features/catalog/components/catalog-grid"
import {
  getCatalogSummaryStats,
  catalogValueProps,
} from "@/features/catalog/data/catalog-data"
import { getAllProducts } from "@/features/catalog/services/get-products"

export const metadata: Metadata = {
  title: "Dịch vụ số | NexCloud",
  description: "Catalog dịch vụ số của NexCloud gồm VPS, Cloud Server, Giftcard, Game Cards, SIM số đẹp và nạp tiền điện thoại.",
}

export default async function ServicesPage() {
  const { items: catalogServices } = await getAllProducts()
  const catalogSummaryStats = getCatalogSummaryStats(catalogServices)

  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 lg:px-8">
        <section className="space-y-8">
          <div className="space-y-5 text-center">
            <Badge variant="outline" className="mx-auto inline-flex">
              Catalog public
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Tất cả dịch vụ số trong một catalog rõ ràng, dễ bán và dễ mở rộng
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Phase 1 tập trung dựng public product routes để người dùng từ landing có thể đi vào page thật, đọc rõ sản phẩm và tiếp tục sang dashboard khi cần giao dịch.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {catalogSummaryStats.map((stat) => (
              <Card key={stat.label} className="border-border/80 bg-card/90">
                <CardContent className="space-y-2 p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="services" className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Danh mục sản phẩm</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Catalog dịch vụ public đã sẵn sàng làm entry point
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm text-muted-foreground md:flex">
              <ShieldCheck className="size-4 text-primary" />
              Prisma-backed catalog + fallback an toàn
            </div>
          </div>

          {catalogServices.length > 0 ? (
            <CatalogGrid services={catalogServices} />
          ) : (
            <Card className="border-border/80 bg-card/90">
              <CardContent className="p-0">
                <Empty className="border-none">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShieldCheck className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Catalog hiện chưa có sản phẩm</EmptyTitle>
                    <EmptyDescription>
                      Database chưa có product active và fallback cũng không có dữ liệu hiển thị.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="sm:flex-row sm:justify-center">
                    <Button asChild>
                      <Link href="/">Về landing page</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {catalogValueProps.map((item) => (
            <Card key={item.title} className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted">
                  <item.icon className="size-5 text-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  )
}
