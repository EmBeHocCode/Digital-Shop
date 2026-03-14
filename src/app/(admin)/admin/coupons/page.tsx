import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { getCoupons } from "@/services/payment-service";

export default async function AdminCouponsRoute() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Quản lý mã giảm giá</h1>
      <Table
        headers={["Mã", "Mô tả", "Loại", "Giá trị", "Trạng thái"]}
        rows={coupons.map((coupon) => [
          coupon.code,
          coupon.description,
          coupon.discountType,
          String(coupon.discountValue),
          <Badge key={coupon.id} label={coupon.isActive ? "Đang áp dụng" : "Tạm ngưng"} />
        ])}
      />
    </div>
  );
}
