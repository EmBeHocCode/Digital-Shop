import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminSummaryCardProps {
  label: string
  value: string | number
  description: string
  meta?: ReactNode
}

export function AdminSummaryCard({
  label,
  value,
  description,
  meta,
}: AdminSummaryCardProps) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-1 pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{description}</p>
        {meta}
      </CardContent>
    </Card>
  )
}
