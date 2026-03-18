"use client"

import { useId } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  { month: "Jan", revenue: 18600, profit: 8000 },
  { month: "Feb", revenue: 30500, profit: 14500 },
  { month: "Mar", revenue: 23700, profit: 10200 },
  { month: "Apr", revenue: 27300, profit: 12800 },
  { month: "May", revenue: 20900, profit: 9500 },
  { month: "Jun", revenue: 31400, profit: 16000 },
  { month: "Jul", revenue: 38700, profit: 19200 },
  { month: "Aug", revenue: 36100, profit: 17500 },
  { month: "Sep", revenue: 41200, profit: 21000 },
  { month: "Oct", revenue: 38900, profit: 18700 },
  { month: "Nov", revenue: 44100, profit: 22500 },
  { month: "Dec", revenue: 52300, profit: 27800 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "oklch(0.62 0.22 248)",
      dark: "oklch(0.76 0.17 226)",
    },
  },
  profit: {
    label: "Profit",
    theme: {
      light: "oklch(0.72 0.18 160)",
      dark: "oklch(0.82 0.15 156)",
    },
  },
} satisfies ChartConfig

export function RevenueChart() {
  const mounted = useHydrated()
  const chartId = useId().replace(/:/g, "")

  return (
    <PremiumCard className="p-6" variant="muted">
      <SectionHeader
        description="Xu hướng doanh thu và lợi nhuận theo tháng với accent depth nhẹ, dễ đọc hơn trên nền dark."
        eyebrow="Trend signal"
        title="Revenue Overview"
        titleClassName="text-xl sm:text-2xl"
      />
      <div className="mt-6">
        {!mounted ? (
          <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />
        ) : (
        <ChartContainer config={chartConfig} className="chart-neon-shell h-[320px] w-full p-4">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 8, right: 8, top: 18 }}
          >
            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tick={{ fill: "var(--chart-axis)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tick={{ fill: "var(--chart-axis)" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="border-border/60 bg-background/88 backdrop-blur-md"
                />
              }
            />
            <defs>
              <linearGradient id={`${chartId}-fill-revenue`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                <stop offset="85%" stopColor="var(--color-revenue)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id={`${chartId}-fill-profit`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-profit)" stopOpacity={0.42} />
                <stop offset="85%" stopColor="var(--color-profit)" stopOpacity={0.03} />
              </linearGradient>
              <filter id={`${chartId}-revenue-glow`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${chartId}-profit-glow`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Area
              dataKey="profit"
              type="monotone"
              fill={`url(#${chartId}-fill-profit)`}
              stroke="var(--color-profit)"
              strokeWidth={2.5}
              filter={`url(#${chartId}-profit-glow)`}
              activeDot={{
                r: 5,
                fill: "var(--color-profit)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill={`url(#${chartId}-fill-revenue)`}
              stroke="var(--color-revenue)"
              strokeWidth={2.5}
              filter={`url(#${chartId}-revenue-glow)`}
              activeDot={{
                r: 5,
                fill: "var(--color-revenue)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
        )}
      </div>
    </PremiumCard>
  )
}
