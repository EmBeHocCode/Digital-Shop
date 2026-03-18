"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionShell } from "@/features/landing/components/section-shell"

const faqs = [
  {
    question: "Sau khi thanh toán, bao lâu tôi nhận được dịch vụ?",
    answer:
      "Hầu hết dịch vụ như thẻ game, giftcard, nạp điện thoại được giao tức thì ngay sau khi thanh toán thành công. VPS và Cloud Server thường khởi tạo trong vòng 30–60 giây. SIM số đẹp giao hàng toàn quốc trong 1–3 ngày làm việc.",
  },
  {
    question: "NexCloud hỗ trợ những phương thức thanh toán nào?",
    answer:
      "Chúng tôi hỗ trợ chuyển khoản ngân hàng, ví tài khoản nội bộ và luồng thanh toán thẻ qua Stripe. Một số phương thức thanh toán khác vẫn đang được hoàn thiện theo lộ trình.",
  },
  {
    question: "Tôi có thể dùng thử VPS trước khi mua không?",
    answer:
      "Có, gói VPS Starter có 7 ngày dùng thử miễn phí. Sau thời gian dùng thử, bạn có thể nâng cấp lên gói trả phí hoặc hủy mà không mất phí.",
  },
  {
    question: "Nếu mã thẻ không hoạt động, tôi cần làm gì?",
    answer:
      "Liên hệ ngay với đội hỗ trợ qua live chat hoặc Zalo, chúng tôi sẽ xác minh và cấp lại mã mới hoặc hoàn tiền theo chính sách áp dụng.",
  },
  {
    question: "VPS và Cloud Server của NexCloud đặt ở đâu?",
    answer:
      "Chúng tôi cung cấp máy chủ tại nhiều vị trí như Hà Nội, TP. Hồ Chí Minh, Singapore, Tokyo, Frankfurt và Los Angeles. Bạn có thể chọn vị trí phù hợp khi đặt hàng.",
  },
  {
    question: "Tôi có thể nâng hoặc hạ cấu hình VPS không?",
    answer:
      "Hoàn toàn được. Bạn có thể nâng hoặc hạ cấu hình VPS bất cứ lúc nào từ khu vực tài khoản mà không cần cài lại hệ điều hành.",
  },
  {
    question: "NexCloud có hỗ trợ API để tích hợp hệ thống không?",
    answer:
      "Schema và nền quản trị hiện đã chuẩn bị để mở rộng API theo từng domain sản phẩm. Tài liệu đối tác đầy đủ vẫn đang được hoàn thiện.",
  },
]

export function FAQ() {
  return (
    <SectionShell
      id="faq"
      description="Các câu hỏi thường gặp được trình bày gọn hơn để giữ nhịp đọc ở cuối landing nhưng vẫn đủ rõ cho người đang chuẩn bị mua."
      eyebrow="FAQ"
      title="Câu hỏi thường gặp"
      tone="violet"
      contentClassName="mx-auto max-w-4xl"
    >
      <PremiumCard className="overflow-hidden p-3 sm:p-4" variant="muted">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="rounded-2xl border border-transparent px-4 transition-all hover:border-border/80 hover:bg-black/[0.025] dark:hover:border-white/8 dark:hover:bg-white/[0.025] sm:px-5"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-foreground sm:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </PremiumCard>
    </SectionShell>
  )
}
