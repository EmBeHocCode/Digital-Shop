import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingBreakdownLine {
  label: string
  value: string
}

interface PricingBreakdownCardProps {
  title: string
  description?: string
  lines: PricingBreakdownLine[]
  totalLabel?: string
  totalValue?: string
  footer?: ReactNode
}

export function PricingBreakdownCard({
  title,
  description,
  lines,
  totalLabel = "Tổng cộng",
  totalValue,
  footer,
}: PricingBreakdownCardProps) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={`${title}-${line.label}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="text-muted-foreground">{line.label}</span>
              <span className="font-medium text-foreground">{line.value}</span>
            </div>
          ))}
        </div>

        {totalValue ? (
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">{totalLabel}</span>
              <span className="text-lg font-semibold">{totalValue}</span>
            </div>
          </div>
        ) : null}

        {footer ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
