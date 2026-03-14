"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Sau khi thanh toán, bao lâu tôi nhận được dịch vụ?",
    answer: "Hầu hết dịch vụ như thẻ game, giftcard, nạp điện thoại được giao tức thì ngay sau khi thanh toán thành công. VPS và Cloud Server thường khởi tạo trong vòng 30–60 giây. SIM số đẹp giao hàng toàn quốc trong 1–3 ngày làm việc.",
  },
  {
    question: "NexCloud hỗ trợ những phương thức thanh toán nào?",
    answer: "Chúng tôi hỗ trợ chuyển khoản ngân hàng (VietQR), ví điện tử MoMo, ZaloPay, VNPay, thẻ Visa/Mastercard và nạp từ số dư tài khoản NexCloud.",
  },
  {
    question: "Tôi có thể dùng thử VPS trước khi mua không?",
    answer: "Có, gói VPS Starter có 7 ngày dùng thử miễn phí, không cần thẻ tín dụng. Sau thời gian dùng thử, bạn có thể nâng cấp lên gói trả phí hoặc hủy mà không mất phí.",
  },
  {
    question: "Nếu mã thẻ không hoạt động, tôi cần làm gì?",
    answer: "Liên hệ ngay với đội hỗ trợ qua live chat hoặc Zalo, chúng tôi sẽ xác minh và cấp lại mã mới hoặc hoàn tiền 100% trong vòng 24 giờ làm việc.",
  },
  {
    question: "VPS và Cloud Server của NexCloud đặt ở đâu?",
    answer: "Chúng tôi cung cấp máy chủ tại nhiều vị trí: Hà Nội, TP. Hồ Chí Minh (Việt Nam), Singapore, Tokyo, Frankfurt và Los Angeles. Bạn có thể chọn vị trí phù hợp khi đặt hàng.",
  },
  {
    question: "Tôi có thể nâng hoặc hạ cấu hình VPS không?",
    answer: "Hoàn toàn được. Bạn có thể nâng/hạ cấu hình VPS bất cứ lúc nào từ Dashboard mà không cần cài lại hệ điều hành. Việc nâng cấp thường hoàn tất trong vài phút.",
  },
  {
    question: "NexCloud có hỗ trợ API để tích hợp hệ thống không?",
    answer: "Có, NexCloud cung cấp REST API đầy đủ cho phép đối tác tích hợp đặt hàng tự động, kiểm tra trạng thái dịch vụ và quản lý tài khoản. Tài liệu API có tại mục Documentation.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 lg:py-32 bg-muted/20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-3">FAQ</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Mọi thắc mắc về NexCloud đều được giải đáp tại đây.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
