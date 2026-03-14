import { ServerCrash, MapPin, LayoutDashboard, Headphones } from "lucide-react"

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
      "Lựa chọn vị trí đặt máy chủ tại Việt Nam (HN, HCM), Singapore, Nhật Bản và Mỹ — tối ưu độ trễ cho người dùng toàn cầu.",
    highlight: "6 Data Centers",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard thống nhất",
    description:
      "Quản lý toàn bộ dịch vụ — VPS, game card, SIM, giftcard — trong một giao diện dashboard trực quan, dễ dùng trên cả web và mobile.",
    highlight: "All-in-one Panel",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description:
      "Đội ngũ kỹ thuật sẵn sàng 24 giờ mỗi ngày, 7 ngày một tuần. Phản hồi qua live chat, Zalo, Telegram trong vòng 5 phút.",
    highlight: "< 5 min response",
  },
]

export function Benefits() {
  return (
    <section className="py-24 lg:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground mb-3">Lợi ích nền tảng</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Cơ sở hạ tầng đáng tin cậy
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Hệ thống được thiết kế để hoạt động liên tục, ổn định và bảo mật ở mọi quy mô.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
            >
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                <b.icon className="size-5 text-foreground" />
              </div>
              <div>
                <div className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground mb-3">
                  {b.highlight}
                </div>
                <h3 className="text-sm font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
