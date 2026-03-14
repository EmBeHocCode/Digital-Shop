import { Card } from "@/components/ui/card";

export default function AdminSettingsRoute() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Cài đặt hệ thống</h1>
      <div className="grid gap-5 md:grid-cols-2">
        {[
          ["Xác thực", "Chuẩn bị cấu trúc cho NextAuth hoặc JWT."],
          ["Cổng thanh toán", "Sẵn sàng thêm bộ kết nối cho VNPay, MoMo, ZaloPay và thanh toán tiền mã hóa."],
          ["Cấp phát dịch vụ", "Tách lớp dịch vụ cho cấp phát VPS và giao mã gift card."],
          ["Triển khai", "Giao diện có thể chạy trên Vercel, còn backend và PostgreSQL có thể triển khai trên VPS."]
        ].map(([title, description]) => (
          <Card key={title}>
            <p className="text-lg font-bold text-ink">{title}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
