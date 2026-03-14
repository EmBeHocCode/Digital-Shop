import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { catalogServices } from "@/features/catalog/data/catalog-data"

export function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">Sản phẩm</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Tất cả dịch vụ số trong một nền tảng
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Từ hạ tầng đám mây đến thẻ game, SIM số — mọi thứ bạn cần đều có tại NexCloud.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogServices.map((service) => (
            <div
              key={service.slug}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-7 hover:border-foreground/30 transition-all duration-200"
            >
              <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted">
                <service.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-5 text-base font-semibold">{service.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-grow">{service.description}</p>

              <ul className="mt-5 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="size-1 rounded-full bg-muted-foreground/60 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{service.price}</p>
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Xem thêm <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
