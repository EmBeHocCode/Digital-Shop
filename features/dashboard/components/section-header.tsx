import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
  titleClassName?: string
  highlightTitle?: boolean
}

export function SectionHeader({
  action,
  className,
  description,
  eyebrow,
  highlightTitle = false,
  title,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <div className="inline-flex">
            <span className="premium-chip px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground/85">
              {eyebrow}
            </span>
          </div>
        ) : null}
        <div className="space-y-2">
          <h2
            className={cn(
              "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
              highlightTitle && "premium-accent-text",
              titleClassName
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  )
}
