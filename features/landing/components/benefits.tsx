import { Headphones, LayoutDashboard, MapPin, ServerCrash } from "lucide-react"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionShell } from "@/features/landing/components/section-shell"

const benefits = [
  {
    icon: ServerCrash,
    title: "Hiệu năng vượt trội",
    description:
      "Máy chủ trang bị NVMe SSD Gen 4, CPU Intel Xeon thế hệ mới nhất, đảm bảo tốc độ I/O và xử lý tối đa cho mọi khối lượng công việc.",
    highlight: "10 Gbps Network",
  },
  {
    icon: MapPin,
    title: "Nhiều vị trí máy chủ",
    description:
      "Lựa chọn vị trí đặt máy chủ tại Việt Nam, Singapore, Nhật Bản và Mỹ để tối ưu độ trễ cho nhiều nhóm khách hàng khác nhau.",
    highlight: "6 Data Centers",
  },
  {
    icon: LayoutDashboard,
    title: "Workspace thống nhất",
    description:
      "Quản lý toàn bộ dịch vụ — VPS, game card, SIM, giftcard — trong một giao diện có nhịp vận hành đồng bộ giữa account và admin.",
    highlight: "All-in-one Panel",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description:
      "Đội ngũ kỹ thuật sẵn sàng 24 giờ mỗi ngày, 7 ngày một tuần với các kênh phản hồi phù hợp cho cả cá nhân và doanh nghiệp.",
    highlight: "< 5 min response",
  },
]

export function Benefits() {
  return (
    <SectionShell
      description="Hạ tầng bên dưới được thiết kế để giữ trải nghiệm storefront mượt, đồng thời phục vụ các luồng vận hành và hỗ trợ sau bán."
      eyebrow="Platform benefits"
      title="Cơ sở hạ tầng đáng tin cậy"
      tone="blue"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit, index) => (
          <PremiumCard
            key={benefit.title}
            className="flex h-full flex-col gap-5 p-6"
            interactive
            variant={index === 0 || index === 2 ? "hero" : "default"}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/8 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-sky-300">
              <benefit.icon className="size-5" />
            </div>
            <div>
              <span className="premium-chip px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {benefit.highlight}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{benefit.description}</p>
            </div>
          </PremiumCard>
        ))}
      </div>
    </SectionShell>
  )
}
