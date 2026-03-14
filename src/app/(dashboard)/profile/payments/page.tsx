import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";
import { formatCurrency, formatDate } from "@/utils/format";

export default async function ProfilePaymentsRoute() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Lịch sử thanh toán</h1>
      {profile.payments.length ? (
        <Table
          headers={["Mã thanh toán", "Ngày", "Phương thức", "Số tiền", "Trạng thái"]}
          rows={profile.payments.map((payment) => [
            payment.id,
            formatDate(payment.createdAt),
            payment.method,
            formatCurrency(payment.amount),
            <Badge key={payment.id} label={payment.status} status={payment.status} />
          ])}
        />
      ) : (
        <EmptyState
          title="Chưa có thanh toán nào"
          description="Các giao dịch của tài khoản này sẽ xuất hiện ở đây sau khi hoàn tất thanh toán."
          ctaLabel="Khám phá sản phẩm"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
