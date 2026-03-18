import { CreditCard, Globe, Headphones, LayoutDashboard, Shield, Zap } from "lucide-react"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionShell } from "@/features/landing/components/section-shell"

const features = [
  {
    name: "Kích hoạt tức thì",
    description:
      "Dịch vụ được giao ngay sau khi thanh toán thành công. Không chờ đợi, không phê duyệt thủ công.",
    icon: Zap,
  },
  {
    name: "Thanh toán an toàn",
    description:
      "Hỗ trợ nhiều phương thức thanh toán với lifecycle trạng thái rõ ràng cho cả người mua và vận hành nội bộ.",
    icon: CreditCard,
  },
  {
    name: "Triển khai cloud nhanh",
    description:
      "Khởi tạo VPS và Cloud Server chỉ trong vài giây với hạ tầng đặt tại Việt Nam và quốc tế.",
    icon: Globe,
  },
  {
    name: "Giá cả minh bạch",
    description:
      "Không phí ẩn, không hợp đồng dài hạn. Giá niêm yết rõ ràng, có thể hủy bất cứ lúc nào.",
    icon: Shield,
  },
  {
    name: "Workspace thống nhất",
    description:
      "Quản lý dịch vụ, thanh toán, đơn hàng và billing trong một khu tài khoản đồng bộ và bảo vệ bằng auth.",
    icon: LayoutDashboard,
  },
  {
    name: "Hỗ trợ 24/7",
    description:
      "Đội ngũ kỹ thuật hỗ trợ qua live chat, Zalo, Telegram và email, tối ưu cho cả khách hàng cá nhân lẫn vận hành doanh nghiệp.",
    icon: Headphones,
  },
]

export function Features() {
  return (
    <SectionShell
      id="features"
      description="Được xây dựng như một SaaS commerce platform cho cả cá nhân lẫn doanh nghiệp: rõ trạng thái, rõ thanh toán, rõ vận hành."
      eyebrow="Why NexCloud"
      title="Nền tảng dịch vụ số với nhịp vận hành mượt mà hơn"
      tone="cyan"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <PremiumCard
            key={feature.name}
            className="group h-full p-7"
            interactive
            variant={index === 1 || index === 4 ? "hero" : "default"}
          >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-500/15 bg-cyan-500/8 text-cyan-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 group-hover:scale-[1.03] dark:text-cyan-300">
                <feature.icon className="size-5" />
              </div>
            <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
              {feature.name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
          </PremiumCard>
        ))}
      </div>
    </SectionShell>
  )
}
