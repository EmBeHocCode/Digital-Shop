import { Card } from "@/components/ui/card";

export function AIRecommendationList() {
  return (
    <Card>
      <h3 className="text-2xl font-bold text-ink">Gợi ý thông minh</h3>
      <div className="mt-5 space-y-4 text-sm text-muted">
        <p>Đẩy combo VPS Gaming + Steam Wallet vào cuối tuần để tăng AOV.</p>
        <p>Tăng tồn kho Google Play cho khung giờ tối do nhu cầu mobile game tăng.</p>
        <p>Nhắc quản trị viên kiểm tra cảnh báo tồn kho thấp của nhóm gift card bán nhanh.</p>
      </div>
    </Card>
  );
}
