import { FAQItem } from "@/types/domain";

export const faqs: FAQItem[] = [
  {
    id: "faq-01",
    question: "Sau khi thanh toán gift card thì nhận mã ở đâu?",
    answer:
      "Hệ thống mock tự động gán code AVAILABLE thành SOLD khi đơn COMPLETED, sau đó hiển thị code trong chi tiết đơn hàng và gửi email cho người mua.",
    category: "Gift Card"
  },
  {
    id: "faq-02",
    question: "VPS được tạo như thế nào sau khi thanh toán?",
    answer:
      "Khi đơn VPS hoàn tất, mock fulfillment sẽ tạo VPS instance với IP, username, password, trạng thái và đường dẫn control panel để hiển thị ở mục My Services.",
    category: "VPS"
  },
  {
    id: "faq-03",
    question: "Có hỗ trợ nhiều cổng thanh toán không?",
    answer:
      "Kiến trúc service đã tách riêng payment layer để sau này tích hợp VNPay, Momo, ZaloPay và crypto payment mà không làm thay đổi UI chính.",
    category: "Thanh toán"
  },
  {
    id: "faq-04",
    question: "Admin route được bảo vệ như thế nào?",
    answer:
      "Project có middleware kiểm tra cookie phiên và role. Hiện tại dùng mock auth để mô phỏng protected routes và role based access.",
    category: "Bảo mật"
  }
];
