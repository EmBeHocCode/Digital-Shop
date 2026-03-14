import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AIAssistantPanel() {
  return (
    <Card>
      <h3 className="text-2xl font-bold text-ink">Trợ lý phân tích AI</h3>
      <p className="mt-3 text-sm leading-7 text-muted">
        Gợi ý phân tích doanh thu, tồn kho, biên lợi nhuận và xu hướng danh mục bằng mô hình AI
        riêng.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary">Chạy phân tích</Button>
        <Button variant="outline">Xem đặc tả API</Button>
      </div>
    </Card>
  );
}
