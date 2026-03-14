import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Chính sách | MeowMarket",
  description: "Điều khoản, bảo mật và hoàn tiền."
};

export default function PoliciesRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-ink">Chính sách</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Nội dung mẫu được tổ chức tách section để thay bằng CMS hoặc API pháp lý sau này.
        </p>
      </div>
      <div className="space-y-5">
        <Card id="dieu-khoan">
          <h2 className="text-2xl font-bold text-ink">Điều khoản</h2>
          <p className="mt-4 text-sm leading-8 text-muted">
            Người dùng cần cung cấp thông tin chính xác khi thanh toán. Dịch vụ số có thể được giao tự động hoặc cấp phát sau khi hệ thống xác nhận thanh toán.
          </p>
        </Card>
        <Card id="bao-mat">
          <h2 className="text-2xl font-bold text-ink">Bảo mật</h2>
          <p className="mt-4 text-sm leading-8 text-muted">
            Kiến trúc hiện tại đã chuẩn bị middleware, route bảo vệ và phân quyền theo vai trò
            để dễ tích hợp NextAuth hoặc xác thực bằng JWT.
          </p>
        </Card>
        <Card id="hoan-tien">
          <h2 className="text-2xl font-bold text-ink">Hoàn tiền</h2>
          <p className="mt-4 text-sm leading-8 text-muted">
            Các sản phẩm chưa được giao mã hoặc chưa cấp phát có thể xử lý hoàn tiền theo quy
            trình hỗ trợ. Với gift card đã hiển thị mã, chính sách hoàn tiền sẽ được kiểm tra theo
            từng trường hợp.
          </p>
        </Card>
      </div>
    </div>
  );
}
