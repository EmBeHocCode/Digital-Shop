import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/95 p-5 shadow-[0_26px_80px_-58px_rgba(14,165,233,0.35)] md:p-6",
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
