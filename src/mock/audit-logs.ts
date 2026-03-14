import { AuditLog } from "@/types/domain";

export const auditLogs: AuditLog[] = [
  {
    id: "audit-01",
    actorName: "Trần Bảo Châu",
    actorRole: "ADMIN",
    action: "Cập nhật banner",
    resource: "Banner",
    resourceId: "banner-hero-01",
    createdAt: "2026-03-05T08:15:00.000Z",
    detail: "Đổi CTA từ 'Xem ưu đãi' sang 'Mua ngay'."
  },
  {
    id: "audit-02",
    actorName: "Trần Bảo Châu",
    actorRole: "ADMIN",
    action: "Import gift card",
    resource: "GiftCardCode",
    resourceId: "batch-20260306",
    createdAt: "2026-03-06T09:40:00.000Z",
    detail: "Import thêm 120 mã Steam Wallet 200K."
  },
  {
    id: "audit-03",
    actorName: "Trần Bảo Châu",
    actorRole: "ADMIN",
    action: "Chuyển trạng thái đơn",
    resource: "Order",
    resourceId: "MM240301",
    createdAt: "2026-03-01T10:35:00.000Z",
    detail: "Cập nhật đơn sang COMPLETED sau khi fulfillment xong."
  }
];
