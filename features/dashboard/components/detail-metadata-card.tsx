import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { InfoPanel } from "@/features/dashboard/components/info-panel"

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
    <InfoPanel description={description} title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className={cn(
              "premium-data-item p-4",
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
      </div>
    </InfoPanel>
  )
}
