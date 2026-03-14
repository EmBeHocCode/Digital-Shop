import { Star } from "lucide-react"

const testimonials = [
  {
    initials: "NT",
    quote: "Mua VPS xong là chạy ngay, không phải chờ duyệt như các chỗ khác. Tốc độ server ổn định, dùng hơn 1 năm chưa bị downtime lần nào.",
    author: "Nguyễn Trung",
    role: "Lập trình viên Freelance",
    stars: 5,
  },
  {
    initials: "ML",
    quote: "Mua thẻ Steam ở đây tiện nhất, code ra ngay sau thanh toán. Giá cũng rẻ hơn các shop khác, có hỗ trợ qua Zalo rất nhanh.",
    author: "Minh Lâm",
    role: "Game thủ",
    stars: 5,
  },
  {
    initials: "TH",
    quote: "Dùng NexCloud để quản lý toàn bộ hạ tầng cho startup của mình. Hỗ trợ kỹ thuật nhanh, dashboard dễ dùng, và giá hợp lý hơn hẳn AWS.",
    author: "Thanh Hương",
    role: "Co-founder & CTO",
    stars: 5,
  },
  {
    initials: "BK",
    quote: "Đặt SIM số đẹp cho cả gia đình, giao hàng đúng hẹn và giá tốt. Sẽ tiếp tục ủng hộ NexCloud.",
    author: "Bảo Khoa",
    role: "Doanh nhân",
    stars: 5,
  },
  {
    initials: "PA",
    quote: "Nạp thẻ Garena tự động 24/7, không cần chờ nhân viên. Thao tác đơn giản, rất phù hợp cho người dùng không rành công nghệ.",
    author: "Phương Anh",
    role: "Sinh viên",
    stars: 5,
  },
  {
    initials: "VD",
    quote: "Cloud Server của NexCloud hiệu năng cực tốt, tôi chạy hệ thống ERP cho công ty 50 người không có vấn đề gì.",
    author: "Văn Đức",
    role: "IT Manager",
    stars: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground mb-3">Đánh giá</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Khách hàng nói gì về chúng tôi
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-foreground text-foreground" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-muted-foreground flex-grow">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
