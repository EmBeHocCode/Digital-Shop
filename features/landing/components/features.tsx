import { Zap, Shield, CreditCard, Headphones, LayoutDashboard, Globe } from "lucide-react"

const features = [
  {
    name: "Kích hoạt tức thì",
    description: "Dịch vụ được giao ngay sau khi thanh toán thành công. Không chờ đợi, không phê duyệt thủ công.",
    icon: Zap,
  },
  {
    name: "Thanh toán an toàn",
    description: "Hỗ trợ chuyển khoản ngân hàng, ví MoMo, ZaloPay và thẻ Visa/Mastercard với mã hóa SSL.",
    icon: CreditCard,
  },
  {
    name: "Triển khai cloud nhanh",
    description: "Khởi tạo VPS và Cloud Server chỉ trong vài giây với hạ tầng đặt tại Việt Nam và quốc tế.",
    icon: Globe,
  },
  {
    name: "Giá cả minh bạch",
    description: "Không phí ẩn, không hợp đồng dài hạn. Giá niêm yết rõ ràng, có thể hủy bất cứ lúc nào.",
    icon: Shield,
  },
  {
    name: "Dashboard quản lý",
    description: "Quản lý toàn bộ dịch vụ qua một bảng điều khiển thống nhất — theo dõi, gia hạn, nâng cấp dễ dàng.",
    icon: LayoutDashboard,
  },
  {
    name: "Hỗ trợ 24/7",
    description: "Đội ngũ kỹ thuật hỗ trợ qua live chat, Zalo, Telegram và email suốt ngày đêm.",
    icon: Headphones,
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">Tính năng</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Lý do khách hàng tin chọn NexCloud
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Được xây dựng để phục vụ cả cá nhân lẫn doanh nghiệp với trải nghiệm mượt mà nhất.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-xl border border-border bg-card p-7 hover:border-foreground/20 transition-colors"
            >
              <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted">
                <feature.icon className="size-5 text-foreground" />
              </div>
              <h3 className="mt-5 text-base font-semibold">{feature.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
