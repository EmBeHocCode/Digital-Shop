import type { ComponentProps } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PremiumCardVariant = "default" | "hero" | "muted"

interface PremiumCardProps extends ComponentProps<typeof Card> {
  variant?: PremiumCardVariant
  interactive?: boolean
}

const variantClassNames: Record<PremiumCardVariant, string> = {
  default: "",
  hero: "premium-card-hero",
  muted: "premium-card-muted",
}

export function PremiumCard({
  className,
  interactive = false,
  variant = "default",
  ...props
}: PremiumCardProps) {
  return (
    <Card
      className={cn(
        "premium-card",
        interactive && "premium-card-hover",
        variantClassNames[variant],
        className
      )}
      {...props}
    />
  )
}
