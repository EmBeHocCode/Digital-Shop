import { SupportTicketForm } from "@/components/forms/support-ticket-form";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFaqs } from "@/services/ticket-service";

export async function SupportPage() {
  const faqs = await getFaqs();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Hỗ trợ"
          title="FAQ, hướng dẫn mua hàng và quy trình thanh toán"
          description="Trang hỗ trợ tập trung các câu hỏi phổ biến, luồng phiếu hỗ trợ và hướng dẫn giúp người dùng yên tâm hơn khi mua dịch vụ số."
        />
        <Card>
          <h3 className="text-2xl font-bold text-ink">Hướng dẫn mua hàng</h3>
          <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
            <p>1. Tìm sản phẩm bằng thanh tìm kiếm ở đầu trang hoặc danh mục của MeowMarket.</p>
            <p>2. Kiểm tra cấu hình, FAQ, đánh giá và sản phẩm tương tự trước khi mua.</p>
            <p>3. Thêm vào giỏ hàng, áp mã giảm giá và đi qua bước thanh toán.</p>
            <p>4. Theo dõi đơn tại hồ sơ cá nhân, phiếu hỗ trợ hoặc tra cứu đơn hàng.</p>
          </div>
        </Card>
        <FAQAccordion items={faqs} />
      </div>
      <SupportTicketForm />
    </div>
  );
}
