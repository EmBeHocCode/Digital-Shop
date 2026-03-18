import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { PremiumCard } from "@/features/dashboard/components/premium-card"

interface ProfileHeroMetric {
  icon: LucideIcon
  label: string
  value: string | number
  description: string
}

interface ProfileHeroProps {
  eyebrow?: string
  title: string
  description: string
  identityMeta?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
  avatar: ReactNode
  metrics: ProfileHeroMetric[]
}

export function ProfileHero({
  actions,
  avatar,
  badges,
  description,
  eyebrow = "Profile hub",
  identityMeta,
  metrics,
  title,
}: ProfileHeroProps) {
  return (
    <PremiumCard className="overflow-hidden" variant="hero">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500/12 via-cyan-400/6 to-violet-500/10" />
      <div className="absolute right-0 top-0 size-52 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">{avatar}</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
                  {eyebrow}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  <span className="premium-accent-text">{title}</span>
                </h2>
                {identityMeta ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {identityMeta}
                  </div>
                ) : null}
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {description}
                </p>
              </div>
              {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
            </div>
          </div>
          {actions ? (
            <div className="premium-chip flex flex-wrap gap-3 p-2 xl:justify-end">
              {actions}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ description: hint, icon: Icon, label, value }) => (
            <div key={label} className="premium-data-item p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                    {label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/8 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Icon className="size-4.5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </div>
    </PremiumCard>
  )
}
