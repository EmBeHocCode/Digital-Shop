import { Table } from "@/components/dashboard/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { getGiftCardInventory } from "@/services/giftcard/giftcard-inventory-service";

export default async function AdminGiftCardsRoute() {
  const giftCardCodes = await getGiftCardInventory();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Kho gift card</h1>
      <Table
        headers={["Mã", "Sản phẩm", "Đơn hàng", "Trạng thái"]}
        rows={giftCardCodes.map((code) => [
          code.code,
          code.productId,
          code.orderId ?? "-",
          <StatusBadge key={code.id} status={code.status} />
        ])}
      />
    </div>
  );
}
