import type { LucideIcon } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PremiumCard } from "@/features/dashboard/components/premium-card"

type StatAccent = "blue" | "cyan" | "violet" | "emerald"

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  accent?: StatAccent
  className?: string
}

const accentClasses: Record<
  StatAccent,
  {
    icon: string
    line: string
  }
> = {
  blue: {
    icon: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    line: "from-sky-400/70 via-cyan-300/45 to-transparent",
  },
  cyan: {
    icon: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    line: "from-cyan-400/70 via-emerald-300/40 to-transparent",
  },
  violet: {
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    line: "from-violet-400/70 via-sky-300/40 to-transparent",
  },
  emerald: {
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    line: "from-emerald-400/70 via-cyan-300/40 to-transparent",
  },
}

export function StatCard({
  accent = "blue",
  className,
  description,
  icon: Icon,
  label,
  value,
}: StatCardProps) {
  const accentTheme = accentClasses[accent]

  return (
    <PremiumCard className={cn("min-h-[172px] overflow-hidden", className)} interactive>
      <div
        className={cn(
          "absolute -right-10 -top-10 size-28 rounded-full blur-3xl",
          accent === "blue" && "bg-sky-500/14",
          accent === "cyan" && "bg-cyan-500/14",
          accent === "violet" && "bg-violet-500/14",
          accent === "emerald" && "bg-emerald-500/14"
        )}
      />
      <div className={cn("absolute inset-x-5 top-0 h-px bg-gradient-to-r", accentTheme.line)} />
      <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
              {label}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
              accentTheme.icon
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </PremiumCard>
  )
}
