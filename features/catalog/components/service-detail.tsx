import Link from "next/link"
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PurchaseExperience } from "@/features/catalog/components/purchase-experience"
import type { CatalogService } from "@/features/catalog/types"

interface ServiceDetailProps {
  service: CatalogService
}

export function ServiceDetail({ service }: ServiceDetailProps) {
  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 lg:px-8">
        <div className="space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Quay lại catalog dịch vụ
          </Link>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px]">
            <div className="space-y-8">
              <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-[0_30px_90px_-52px_rgba(14,165,233,0.35)] backdrop-blur">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted">
                    <service.icon className="size-7 text-foreground" />
                  </div>
                  <Badge variant="outline">{service.category}</Badge>
                  <Badge variant="outline" className="gap-1.5 border-border/80 bg-muted/30">
                    <Sparkles className="size-3.5" />
                    {service.domain.replaceAll("_", " ")}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                    {service.name}
                  </h1>
                  <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{service.tagline}</p>
                  <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{service.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {service.highlights.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" size="lg" asChild>
                    <Link href="/cart">
                      Xem giỏ hàng hiện tại
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/checkout">Đi thẳng tới checkout</Link>
                  </Button>
                  <Button variant="ghost" size="lg" asChild>
                    <Link href="/dashboard">Truy cập dashboard</Link>
                  </Button>
                </div>
              </div>

              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="border-border/80 bg-card/90">
                  <CardHeader>
                    <CardTitle>Tính năng chính</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card/90">
                  <CardHeader>
                    <CardTitle>Phù hợp cho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {service.idealFor.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="mt-1 size-2 rounded-full bg-foreground/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Card className="border-border/80 bg-card/90">
                  <CardHeader>
                    <CardTitle>Lợi thế vận hành</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {service.operations.map((item) => (
                        <div key={item} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            <div className="space-y-4">
              <PurchaseExperience
                service={{
                  slug: service.slug,
                  name: service.name,
                  price: service.price,
                  priceValue: service.priceValue,
                  category: service.category,
                }}
              />

              <Card className="border-border/80 bg-card/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="size-4 text-foreground" />
                    Ghi chú trước khi mua
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>- Cấu hình và tóm tắt giá được cập nhật theo từng loại sản phẩm để gần với flow mua thực tế hơn.</p>
                  <p>- Cart và checkout hiện giữ nguyên kiến trúc cũ nhưng đã bắt đầu mang theo option summary cho từng sản phẩm.</p>
                  <p>- Nếu bạn cần mua theo yêu cầu riêng hoặc số lượng lớn, dashboard sẽ là nơi theo dõi đơn hàng và billing tập trung.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
