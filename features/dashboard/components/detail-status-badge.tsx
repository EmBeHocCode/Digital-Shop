import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DetailStatusTone } from "@/features/dashboard/detail-presenters"

interface DetailStatusBadgeProps {
  label: string
  tone?: DetailStatusTone
  className?: string
}

const toneClassNames: Record<DetailStatusTone, string> = {
  neutral: "border-border bg-muted/40 text-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

export function DetailStatusBadge({
  label,
  tone,
  className,
}: DetailStatusBadgeProps) {
  const resolvedTone = tone ?? (className ? undefined : "neutral")

  return (
    <Badge
      className={cn(resolvedTone ? toneClassNames[resolvedTone] : undefined, className)}
      variant="outline"
    >
      {label}
    </Badge>
  )
}
