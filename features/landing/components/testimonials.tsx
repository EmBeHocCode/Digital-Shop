import { Star } from "lucide-react"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionShell } from "@/features/landing/components/section-shell"

const testimonials = [
  {
    initials: "NT",
    quote:
      "Mua VPS xong là chạy ngay, không phải chờ duyệt như các chỗ khác. Tốc độ server ổn định, dùng hơn 1 năm chưa bị downtime lần nào.",
    author: "Nguyễn Trung",
    role: "Lập trình viên Freelance",
    stars: 5,
  },
  {
    initials: "ML",
    quote:
      "Mua thẻ Steam ở đây tiện nhất, code ra ngay sau thanh toán. Giá cũng rẻ hơn các shop khác, có hỗ trợ qua Zalo rất nhanh.",
    author: "Minh Lâm",
    role: "Game thủ",
    stars: 5,
  },
  {
    initials: "TH",
    quote:
      "Dùng NexCloud để quản lý toàn bộ hạ tầng cho startup của mình. Hỗ trợ kỹ thuật nhanh, dashboard dễ dùng, và giá hợp lý hơn hẳn AWS.",
    author: "Thanh Hương",
    role: "Co-founder & CTO",
    stars: 5,
  },
  {
    initials: "BK",
    quote:
      "Đặt SIM số đẹp cho cả gia đình, giao hàng đúng hẹn và giá tốt. Sẽ tiếp tục ủng hộ NexCloud.",
    author: "Bảo Khoa",
    role: "Doanh nhân",
    stars: 5,
  },
  {
    initials: "PA",
    quote:
      "Nạp thẻ Garena tự động 24/7, không cần chờ nhân viên. Thao tác đơn giản, rất phù hợp cho người dùng không rành công nghệ.",
    author: "Phương Anh",
    role: "Sinh viên",
    stars: 5,
  },
  {
    initials: "VD",
    quote:
      "Cloud Server của NexCloud hiệu năng cực tốt, tôi chạy hệ thống ERP cho công ty 50 người không có vấn đề gì.",
    author: "Văn Đức",
    role: "IT Manager",
    stars: 5,
  },
]

export function Testimonials() {
  return (
    <SectionShell
      description="Các đánh giá quan trọng nhất đến từ sự ổn định, tốc độ kích hoạt và khả năng hỗ trợ khi khách hàng đang xử lý công việc thật."
      eyebrow="Social proof"
      title="Khách hàng nói gì về NexCloud"
      tone="cyan"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <PremiumCard
            key={testimonial.author}
            className="flex h-full flex-col p-6"
            interactive
            variant={index === 2 ? "hero" : "default"}
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: testimonial.stars }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  className="size-3.5 fill-sky-500 text-sky-500 dark:fill-sky-300 dark:text-sky-300"
                />
              ))}
            </div>
            <blockquote className="mt-5 flex-1 text-sm leading-7 text-muted-foreground">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3 border-t border-border/70 pt-5 dark:border-white/6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/8 text-sm font-semibold text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:text-sky-100">
                {testimonial.initials}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{testimonial.author}</div>
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>
    </SectionShell>
  )
}
