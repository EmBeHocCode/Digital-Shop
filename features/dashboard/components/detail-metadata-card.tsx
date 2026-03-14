import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DetailMetadataItem {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

interface DetailMetadataCardProps {
  title: string
  description?: string
  items: DetailMetadataItem[]
}

export function DetailMetadataCard({
  title,
  description,
  items,
}: DetailMetadataCardProps) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className={cn(
              "rounded-2xl border border-border/70 bg-muted/20 p-4",
              item.fullWidth && "sm:col-span-2"
            )}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <div className="mt-2 text-sm font-medium text-foreground">
              {item.value || "—"}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
