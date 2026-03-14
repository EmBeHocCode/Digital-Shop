import { Review } from "@/types/domain";

export const reviews: Review[] = [
  {
    id: "review-01",
    productId: "prod-vps-basic",
    userName: "Pham Quynh Nhi",
    rating: 5,
    title: "Setup nhanh và giao diện dễ dùng",
    content: "Đơn VPS tạo rất nhanh, thông tin IP và mật khẩu hiển thị rõ trong dashboard.",
    createdAt: "2026-02-20T08:00:00.000Z"
  },
  {
    id: "review-02",
    productId: "prod-steam-wallet",
    userName: "Hoang Gia Bao",
    rating: 5,
    title: "Gift card giao code mượt",
    content: "Thanh toán xong nhận code ngay, email và trang đơn hàng đều có thông tin.",
    createdAt: "2026-02-22T08:00:00.000Z"
  },
  {
    id: "review-03",
    productId: "prod-cloud-gaming",
    userName: "Le Thu Ha",
    rating: 4,
    title: "Cloud gaming giao diện đẹp",
    content: "Cảm giác tin cậy, không bị rối khi thanh toán trên điện thoại.",
    createdAt: "2026-02-25T08:00:00.000Z"
  }
];
