import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { catalogServices } from "@/features/catalog/data/catalog-data"
import { SectionShell } from "@/features/landing/components/section-shell"

export function Services() {
  return (
    <SectionShell
      id="services"
      description="Từ hạ tầng đám mây đến thẻ game, SIM số và topup — mỗi nhóm sản phẩm có trải nghiệm mua riêng, nhưng vẫn giữ cùng một nhịp checkout và vận hành."
      eyebrow="Product catalog"
      title="Tất cả dịch vụ số trong một nền tảng"
      tone="blue"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {catalogServices.map((service) => (
          <PremiumCard
            key={service.slug}
            className="group flex h-full flex-col overflow-hidden p-7"
            interactive
            variant={service.isFeatured ? "hero" : "default"}
          >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-sky-400/70 via-cyan-300/45 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/8 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-sky-300">
                <service.icon className="size-5" />
              </div>
              <span className="premium-chip px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                {service.domain}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{service.name}</h3>
                <p className="text-sm font-medium text-sky-700 dark:text-sky-100/85">{service.tagline}</p>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{service.description}</p>
            </div>

            <ul className="mt-6 space-y-2.5">
              {service.features.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-1.5 rounded-full bg-sky-300/80" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/70 pt-5 dark:border-white/6">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                  Giá khởi điểm
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{service.price}</p>
              </div>
              <Link
                href={`/services/${service.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/82 px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/24 hover:bg-cyan-500/8 dark:border-white/8 dark:bg-white/[0.03]"
              >
                Xem thêm
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </PremiumCard>
        ))}
      </div>
    </SectionShell>
  )
}
