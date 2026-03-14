import { SupportTicket } from "@/types/domain";

export const tickets: SupportTicket[] = [
  {
    id: "ticket-01",
    userId: "user-01",
    subject: "Cần reset mật khẩu VPS",
    category: "VPS",
    status: "IN_PROGRESS",
    createdAt: "2026-03-02T11:00:00.000Z",
    messages: [
      {
        id: "msg-01",
        sender: "USER",
        body: "Nhờ đội hỗ trợ reset mật khẩu instance VPS Basic giúp mình.",
        createdAt: "2026-03-02T11:00:00.000Z"
      },
      {
        id: "msg-02",
        sender: "ADMIN",
        body: "Đội kỹ thuật đã tiếp nhận, sẽ phản hồi trong 15 phút.",
        createdAt: "2026-03-02T11:10:00.000Z"
      }
    ]
  },
  {
    id: "ticket-02",
    userId: "user-01",
    subject: "Gift card chưa thấy email",
    category: "Gift Card",
    status: "RESOLVED",
    createdAt: "2026-02-28T16:00:00.000Z",
    messages: [
      {
        id: "msg-03",
        sender: "USER",
        body: "Mình cần kiểm tra email giao code Steam Wallet.",
        createdAt: "2026-02-28T16:00:00.000Z"
      },
      {
        id: "msg-04",
        sender: "ADMIN",
        body: "Code đã được gửi lại vào email và cũng hiển thị trong đơn hàng.",
        createdAt: "2026-02-28T16:08:00.000Z"
      }
    ]
  }
];
