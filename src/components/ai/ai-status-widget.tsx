import { Card } from "@/components/ui/card";

export function AIStatusWidget() {
  return (
    <Card className="bg-gradient-to-br from-[#fff0f6] to-[#eef3ff]">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Trạng thái dịch vụ AI</p>
      <p className="mt-3 text-3xl font-black text-ink">Sẵn sàng kết nối FastAPI</p>
      <p className="mt-3 text-sm leading-7 text-muted">
        Kiến trúc giao diện đã có lớp dịch vụ để gọi sang dịch vụ AI Python qua JSON API.
      </p>
    </Card>
  );
}
