"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <section id="pricing" className="py-24 lg:py-32 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">Bảng giá</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Giá minh bạch, không phí ẩn
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Thanh toán theo tháng hoặc năm. Tiết kiệm thêm 20% với gói năm.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={cn("text-sm", !annual ? "text-foreground font-medium" : "text-muted-foreground")}>
              Hàng tháng
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none",
                annual ? "bg-foreground" : "bg-muted border border-border"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 transform rounded-full bg-background transition-transform",
                  annual ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm flex items-center gap-2", annual ? "text-foreground font-medium" : "text-muted-foreground")}>
              Hàng năm
              <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background font-medium">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {vpsPlans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-7",
                plan.highlighted
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-background text-foreground border border-border px-4 py-1 text-xs font-semibold">
                    Phổ biến nhất
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className={cn("mt-1 text-sm", plan.highlighted ? "text-background/70" : "text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {annual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={cn("text-sm", plan.highlighted ? "text-background/60" : "text-muted-foreground")}>
                    /tháng
                  </span>
                </div>
                <p className={cn("mt-1.5 text-xs font-mono", plan.highlighted ? "text-background/60" : "text-muted-foreground")}>
                  {plan.specs}
                </p>
              </div>

              <ul className="mt-7 space-y-3 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={cn("size-4 shrink-0 mt-0.5", plan.highlighted ? "text-background" : "text-foreground")} />
                    <span className={cn("text-sm", plan.highlighted ? "text-background/90" : "text-muted-foreground")}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-8 w-full",
                  plan.highlighted
                    ? "bg-background text-foreground hover:bg-background/90"
                    : ""
                )}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
