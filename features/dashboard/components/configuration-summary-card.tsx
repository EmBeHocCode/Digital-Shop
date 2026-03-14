import type { CartItemConfiguration } from "@/features/cart/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"

interface ConfigurationSummaryCardProps {
  title?: string
  description?: string
  configuration?: CartItemConfiguration
  emptyText?: string
}

function getConfigurationKindLabel(kind: CartItemConfiguration["kind"]) {
  switch (kind) {
    case "infrastructure":
      return "Hạ tầng"
    case "digital_goods":
      return "Digital goods"
    case "sim":
      return "SIM"
    case "topup":
      return "Top-up"
  }
}

export function ConfigurationSummaryCard({
  title = "Cấu hình đã lưu",
  description,
  configuration,
  emptyText = "Chưa có cấu hình đã lưu cho mục này.",
}: ConfigurationSummaryCardProps) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {configuration ? (
            <DetailStatusBadge
              label={getConfigurationKindLabel(configuration.kind)}
              tone="info"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {configuration ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">{configuration.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {configuration.allowQuantityAdjustment
                  ? "Cho phép điều chỉnh số lượng trong cùng cấu hình."
                  : "Cấu hình này được khóa theo đơn vị riêng lẻ."}
              </p>
            </div>
            <ul className="space-y-2">
              {configuration.summaryLines.map((line) => (
                <li
                  key={`${configuration.title}-${line}`}
                  className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
