import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function AboutPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Về MeowMarket"
        title="Sàn dịch vụ số được thiết kế cho người dùng Việt Nam"
        description="Thương hiệu theo hướng dễ thương, mềm mại nhưng đáng tin cậy, tập trung vào mua nhanh, giao hàng số rõ ràng và trải nghiệm như một startup công nghệ."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h3 className="text-xl font-bold text-ink">Câu chuyện thương hiệu</h3>
          <p className="mt-4 text-sm leading-7 text-muted">
            MeowMarket ra đời để gom các dịch vụ số như VPS, cloud, gift card và thẻ game vào một giao diện mua sắm dễ dùng, đồng thời dễ mở rộng phần backend.
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-ink">Vì sao chọn chúng tôi</h3>
          <p className="mt-4 text-sm leading-7 text-muted">
            Giao diện rõ ràng, thanh toán gọn gàng, phiếu hỗ trợ minh bạch, tra cứu đơn hàng nhanh và kiến trúc sẵn sàng cho môi trường vận hành thực tế.
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-ink">Sứ mệnh</h3>
          <p className="mt-4 text-sm leading-7 text-muted">
            Xây một sàn dịch vụ số thân thiện nhưng đủ chuẩn để kết nối với cổng thanh toán, API cấp phát dịch vụ và các công cụ AI cho doanh nghiệp.
          </p>
        </Card>
      </div>
    </div>
  );
}
