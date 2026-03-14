import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

export function OrderSummary({
  subtotal,
  discount,
  total
}: {
  subtotal: number;
  discount: number;
  total: number;
}) {
  return (
    <Card>
      <h3 className="text-xl font-bold text-ink">Tóm tắt đơn hàng</h3>
      <div className="mt-6 space-y-4 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Giảm giá</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-rose-100 pt-4 text-base font-bold text-ink">
          <span>Tổng thanh toán</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
}
