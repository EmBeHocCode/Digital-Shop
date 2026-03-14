import { Notification } from "@/types/domain";

export const notifications: Notification[] = [
  {
    id: "noti-01",
    userId: "user-01",
    title: "Gift card đã được giao",
    description: "Mã Steam Wallet của bạn đã xuất hiện trong chi tiết đơn hàng.",
    type: "ORDER",
    level: "SUCCESS",
    isRead: false,
    createdAt: "2026-03-01T10:36:00.000Z",
    link: "/profile/orders"
  },
  {
    id: "noti-02",
    userId: "user-01",
    title: "Ticket có phản hồi mới",
    description: "Đội hỗ trợ đã cập nhật ticket reset mật khẩu VPS.",
    type: "TICKET",
    level: "INFO",
    isRead: false,
    createdAt: "2026-03-02T11:12:00.000Z",
    link: "/profile/tickets"
  },
  {
    id: "noti-03",
    title: "Low stock alert",
    description: "Steam Wallet 200K còn dưới ngưỡng an toàn.",
    type: "STOCK",
    level: "WARNING",
    isRead: false,
    createdAt: "2026-03-03T09:00:00.000Z",
    link: "/admin/giftcards"
  },
  {
    id: "noti-04",
    title: "Thanh toán MoMo thất bại",
    description: "Có một callback lỗi cần kiểm tra log giao dịch.",
    type: "PAYMENT",
    level: "DANGER",
    isRead: true,
    createdAt: "2026-03-04T10:30:00.000Z",
    link: "/admin/payments"
  }
];
