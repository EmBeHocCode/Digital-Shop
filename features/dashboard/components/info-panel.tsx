import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionHeader } from "@/features/dashboard/components/section-header"

interface InfoPanelProps {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  interactive?: boolean
}

export function InfoPanel({
  action,
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  interactive = true,
  title,
}: InfoPanelProps) {
  return (
    <PremiumCard className={className} interactive={interactive} variant="muted">
      <div className="space-y-6 p-6">
        <SectionHeader
          action={action}
          className="gap-3"
          description={description}
          eyebrow={eyebrow}
          title={title}
          titleClassName="text-xl sm:text-2xl"
        />
        <div className={cn("space-y-4", contentClassName)}>{children}</div>
      </div>
    </PremiumCard>
  )
}
