import { PremiumCard } from "@/features/dashboard/components/premium-card"

export function LogoCloud() {
  const networks = [
    { name: "Viettel", badge: "VT" },
    { name: "Vinaphone", badge: "VNP" },
    { name: "Mobifone", badge: "MBF" },
    { name: "Steam", badge: "STM" },
    { name: "Garena", badge: "GRN" },
    { name: "Riot Games", badge: "RIOT" },
  ]

  return (
    <section className="relative py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <PremiumCard className="overflow-hidden p-6 sm:p-8" interactive variant="muted">
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-sky-500/10 via-cyan-400/6 to-violet-500/10" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex">
              <span className="premium-chip px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/85">
                Trust layer
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Hỗ trợ các nhà mạng, nền tảng game và nhà cung cấp dịch vụ số phổ biến nhất trong
              ecosystem hiện tại.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {networks.map((network) => (
              <div
                key={network.name}
                className="premium-chip flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/22 hover:text-foreground"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-xl border border-white/8 bg-background/55 text-[0.62rem] font-semibold tracking-[0.16em] text-foreground/75 dark:bg-white/[0.03]">
                  {network.badge}
                </span>
                <span className="font-medium">{network.name}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </section>
  )
}
