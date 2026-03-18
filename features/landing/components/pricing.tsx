"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionShell } from "@/features/landing/components/section-shell"

const vpsPlans = [
  {
    name: "VPS Starter",
    description: "Phù hợp website cá nhân và dự án nhỏ.",
    monthlyPrice: "99.000đ",
    yearlyPrice: "79.000đ",
    specs: "1 vCPU · 1 GB RAM · 20 GB SSD",
    features: [
      "Băng thông 1 TB/tháng",
      "1 địa chỉ IPv4",
      "Snapshot miễn phí",
      "Hỗ trợ cộng đồng",
    ],
    cta: "Bắt đầu miễn phí",
    highlighted: false,
  },
  {
    name: "VPS Pro",
    description: "Tối ưu cho ứng dụng và website thương mại.",
    monthlyPrice: "249.000đ",
    yearlyPrice: "199.000đ",
    specs: "2 vCPU · 4 GB RAM · 80 GB SSD",
    features: [
      "Băng thông không giới hạn",
      "2 địa chỉ IPv4",
      "Backup tự động hàng ngày",
      "Hỗ trợ ưu tiên",
      "Chống DDoS nâng cao",
    ],
    cta: "Dùng thử 7 ngày",
    highlighted: true,
  },
  {
    name: "Cloud Business",
    description: "Dành cho doanh nghiệp và hệ thống lớn.",
    monthlyPrice: "599.000đ",
    yearlyPrice: "479.000đ",
    specs: "4 vCPU · 8 GB RAM · 200 GB SSD",
    features: [
      "Băng thông không giới hạn",
      "5 địa chỉ IPv4",
      "Backup thời gian thực",
      "Hỗ trợ kỹ thuật 24/7",
      "SLA 99.9%",
      "Private Network",
    ],
    cta: "Liên hệ tư vấn",
    highlighted: false,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <SectionShell
      id="pricing"
      description="Thanh toán theo tháng hoặc năm, cùng các mốc cấu hình rõ ràng để khách hàng đánh giá chi phí nhanh hơn."
      eyebrow="Pricing"
      title="Giá minh bạch, không phí ẩn"
      tone="violet"
    >
      <div className="flex justify-center">
        <div className="premium-chip inline-flex items-center gap-4 p-2">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              !annual
                ? "bg-foreground text-background shadow-[0_14px_28px_-20px_rgba(56,189,248,0.45)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hàng tháng
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              annual
                ? "bg-foreground text-background shadow-[0_14px_28px_-20px_rgba(56,189,248,0.45)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hàng năm
          </button>
          <span className="premium-chip px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
            -20%
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {vpsPlans.map((plan) => (
          <PremiumCard
            key={plan.name}
            className="relative flex h-full flex-col p-7"
            interactive
            variant={plan.highlighted ? "hero" : "default"}
          >
            {plan.highlighted ? (
              <div className="absolute left-6 top-6">
                <span className="premium-chip px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-sky-700 dark:text-sky-200">
                  Phổ biến nhất
                </span>
              </div>
            ) : null}

            <div className={cn(plan.highlighted && "pt-10")}>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{plan.name}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{plan.description}</p>
            </div>

            <div className="mt-8 border-t border-border/70 pt-6 dark:border-white/6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {annual ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-sm text-muted-foreground">/tháng</span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground/85">
                {plan.specs}
              </p>
            </div>

            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/18 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <Check className="size-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={cn(
                "mt-8 rounded-2xl transition-all hover:-translate-y-0.5",
                plan.highlighted
                  ? "border border-sky-400/18 bg-foreground text-background shadow-[0_22px_40px_-26px_rgba(56,189,248,0.45)] hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/92"
                  : "border-border/70 bg-background/82 hover:border-violet-400/24 hover:bg-violet-500/8 dark:border-white/10 dark:bg-white/[0.03]"
              )}
              variant={plan.highlighted ? "default" : "outline"}
            >
              {plan.cta}
            </Button>
          </PremiumCard>
        ))}
      </div>
    </SectionShell>
  )
}
