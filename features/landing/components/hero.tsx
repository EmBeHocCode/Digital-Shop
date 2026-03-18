import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react"
import { HeroActions } from "@/features/landing/components/hero-actions"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { catalogServices } from "@/features/catalog/data/catalog-data"

const heroStats = [
  { label: "Khách hàng active", value: "50,000+" },
  { label: "Kích hoạt trung bình", value: "< 30 giây" },
  { label: "Vận hành hỗ trợ", value: "24/7" },
]

const heroPreviewServices = catalogServices.slice(0, 3)

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-28 size-[20rem] rounded-full bg-sky-500/8 blur-3xl" />
          <div className="absolute right-[8%] top-44 size-[16rem] rounded-full bg-cyan-400/8 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/[0.03] via-transparent to-transparent dark:from-white/[0.03]" />
        </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
          <div className="relative z-[1] max-w-2xl">
            <div className="inline-flex">
              <span className="premium-chip inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-sky-500 dark:bg-sky-300" />
                Marketplace dịch vụ số hàng đầu Việt Nam
                <ArrowRight className="size-3.5 text-sky-600 dark:text-sky-300" />
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
              Mua dịch vụ số.
              <span className="premium-accent-text"> Tức thì.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Nền tảng marketplace kỹ thuật số toàn diện cho hạ tầng đám mây, thẻ game, giftcard,
              SIM số và dịch vụ viễn thông. Kích hoạt nhanh, thanh toán an toàn, vận hành gọn trong
              một hệ sinh thái duy nhất.
            </p>

            <HeroActions />

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="premium-data-item p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground/80">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-[1]">
            <div className="absolute -left-8 top-10 hidden rounded-full border border-white/10 bg-background/78 px-4 py-2 text-xs text-sky-700 shadow-[0_22px_40px_-30px_rgba(56,189,248,0.28)] backdrop-blur-sm dark:bg-white/[0.04] dark:text-sky-100 xl:inline-flex">
              <Sparkles className="mr-2 size-3.5 text-sky-600 dark:text-sky-300" />
              Checkout & provisioning flows
            </div>
            <div className="absolute -bottom-5 right-5 hidden rounded-full border border-white/10 bg-background/78 px-4 py-2 text-xs text-cyan-700 shadow-[0_18px_36px_-28px_rgba(34,211,238,0.24)] backdrop-blur-sm dark:bg-white/[0.04] dark:text-cyan-100 xl:inline-flex">
              <ShieldCheck className="mr-2 size-3.5 text-cyan-600 dark:text-cyan-300" />
              Payment lifecycle synced
            </div>

            <PremiumCard className="overflow-hidden" interactive variant="hero">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500/14 via-cyan-400/8 to-violet-500/10" />
              <div className="absolute right-0 top-0 size-44 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="space-y-6 p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
                      Live marketplace
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      One panel. Nhiều luồng doanh thu.
                    </h2>
                    <p className="max-w-md text-sm leading-7 text-muted-foreground">
                      Trải nghiệm mua hàng được gom thành các domain rõ ràng: infrastructure,
                      digital goods và telecom services.
                    </p>
                  </div>
                  <span className="premium-chip px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
                    Realtime-ready
                  </span>
                </div>

                <div className="grid gap-3">
                  {heroPreviewServices.map((service) => (
                    <div
                      key={service.slug}
                      className="premium-data-item flex items-start gap-4 p-4"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/8 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-sky-300">
                        <service.icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{service.name}</p>
                          {service.isFeatured ? (
                            <span className="premium-chip px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-sky-700 dark:text-sky-200">
                              Featured
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{service.tagline}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{service.price}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {service.domain}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="premium-data-item p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground/80">
                      Catalog domain
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">6 nhóm dịch vụ</p>
                  </div>
                  <div className="premium-data-item p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground/80">
                      Payment state
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Stripe + Wallet</p>
                  </div>
                  <div className="premium-data-item p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground/80">
                      Ops layer
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Admin-ready</p>
                  </div>
                </div>

                <div className="premium-chip inline-flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                  <Zap className="size-3.5 text-sky-600 dark:text-sky-300" />
                  Mỗi luồng sản phẩm được tối ưu cho conversion và vận hành thực tế.
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>
    </section>
  )
}
