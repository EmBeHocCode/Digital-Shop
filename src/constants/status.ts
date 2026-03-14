import type {
  GiftCardCodeStatus,
  NotificationLevel,
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  UserStatus,
  VpsInstanceStatus
} from "@/types/domain";

export const orderStatusMap: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: "Chờ thanh toán", tone: "warning" },
  PAID: { label: "Đã thanh toán", tone: "info" },
  PROCESSING: { label: "Đang xử lý", tone: "info" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
  FAILED: { label: "Thất bại", tone: "danger" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "muted" }
};

export const paymentStatusMap: Record<PaymentStatus, { label: string; tone: string }> = {
  PENDING: { label: "Chờ xử lý", tone: "warning" },
  SUCCESS: { label: "Thành công", tone: "success" },
  FAILED: { label: "Thất bại", tone: "danger" },
  REFUNDED: { label: "Hoàn tiền", tone: "muted" }
};

export const ticketStatusMap: Record<TicketStatus, { label: string; tone: string }> = {
  OPEN: { label: "Mới tạo", tone: "warning" },
  IN_PROGRESS: { label: "Đang xử lý", tone: "info" },
  RESOLVED: { label: "Đã giải quyết", tone: "success" },
  CLOSED: { label: "Đã đóng", tone: "muted" }
};

export const vpsStatusMap: Record<VpsInstanceStatus, { label: string; tone: string }> = {
  PENDING: { label: "Đang chờ", tone: "warning" },
  ACTIVE: { label: "Hoạt động", tone: "success" },
  SUSPENDED: { label: "Tạm khóa", tone: "danger" },
  TERMINATED: { label: "Đã hủy", tone: "muted" },
  EXPIRED: { label: "Hết hạn", tone: "warning" }
};

export const giftCardStatusMap: Record<
  GiftCardCodeStatus,
  { label: string; tone: string }
> = {
  AVAILABLE: { label: "Sẵn sàng", tone: "success" },
  RESERVED: { label: "Đã giữ", tone: "warning" },
  SOLD: { label: "Đã bán", tone: "info" },
  USED: { label: "Đã dùng", tone: "muted" },
  EXPIRED: { label: "Hết hạn", tone: "danger" }
};

export const userStatusMap: Record<UserStatus, { label: string; tone: string }> = {
  ACTIVE: { label: "Hoạt động", tone: "success" },
  SUSPENDED: { label: "Tạm ngưng", tone: "warning" },
  BANNED: { label: "Đã khóa", tone: "danger" }
};

export const notificationLevelMap: Record<
  NotificationLevel,
  { label: string; tone: string }
> = {
  INFO: { label: "Thông tin", tone: "info" },
  SUCCESS: { label: "Tích cực", tone: "success" },
  WARNING: { label: "Cảnh báo", tone: "warning" },
  DANGER: { label: "Khẩn cấp", tone: "danger" }
};
