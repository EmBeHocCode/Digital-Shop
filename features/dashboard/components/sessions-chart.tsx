"use client"

import { useId } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionHeader } from "@/features/dashboard/components/section-header"
import { useHydrated } from "@/hooks/use-hydrated"

const chartData = [
  { day: "Mon", sessions: 1240, users: 890 },
  { day: "Tue", sessions: 1580, users: 1120 },
  { day: "Wed", sessions: 1890, users: 1340 },
  { day: "Thu", sessions: 2210, users: 1580 },
  { day: "Fri", sessions: 1970, users: 1420 },
  { day: "Sat", sessions: 1340, users: 920 },
  { day: "Sun", sessions: 1120, users: 780 },
]

const chartConfig = {
  sessions: {
    label: "Sessions",
    theme: {
      light: "oklch(0.62 0.22 248)",
      dark: "oklch(0.76 0.17 226)",
    },
  },
  users: {
    label: "Unique Users",
    theme: {
      light: "oklch(0.68 0.19 28)",
      dark: "oklch(0.8 0.16 38)",
    },
  },
} satisfies ChartConfig

export function SessionsChart() {
  const mounted = useHydrated()
  const chartId = useId().replace(/:/g, "")

  return (
    <PremiumCard className="p-6" variant="muted">
      <SectionHeader
        description="Nhịp truy cập tuần hiện tại với cách trình bày gọn, sáng hơn và ít cảm giác thành một khối đen."
        eyebrow="Activity pulse"
        title="Weekly Activity"
        titleClassName="text-xl sm:text-2xl"
      />
      <div className="mt-6">
        {!mounted ? (
          <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />
        ) : (
        <ChartContainer config={chartConfig} className="chart-neon-shell h-[320px] w-full p-4">
          <BarChart accessibilityLayer data={chartData} barCategoryGap="26%" margin={{ top: 18, right: 8, left: 2 }}>
            <defs>
              <linearGradient id={`${chartId}-sessions-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sessions)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--color-sessions)" stopOpacity={0.45} />
              </linearGradient>
              <linearGradient id={`${chartId}-users-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-users)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="var(--color-users)" stopOpacity={0.4} />
              </linearGradient>
              <filter id={`${chartId}-sessions-glow`} x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${chartId}-users-glow`} x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--chart-axis)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tick={{ fill: "var(--chart-axis)" }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  className="border-border/60 bg-background/88 backdrop-blur-md"
                />
              }
            />
            <Bar
              dataKey="sessions"
              fill={`url(#${chartId}-sessions-fill)`}
              stroke="var(--color-sessions)"
              strokeWidth={1.2}
              filter={`url(#${chartId}-sessions-glow)`}
              radius={[10, 10, 4, 4]}
            />
            <Bar
              dataKey="users"
              fill={`url(#${chartId}-users-fill)`}
              stroke="var(--color-users)"
              strokeWidth={1.1}
              filter={`url(#${chartId}-users-glow)`}
              radius={[10, 10, 4, 4]}
            />
          </BarChart>
        </ChartContainer>
        )}
      </div>
    </PremiumCard>
  )
}
