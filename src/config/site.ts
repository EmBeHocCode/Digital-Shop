import {
  faGift,
  faHeadset,
  faServer,
  faTags,
  faTicket
} from "@fortawesome/free-solid-svg-icons";

export const siteConfig = {
  name: "MeowMarket",
  title: "MeowMarket | Marketplace dịch vụ số đáng tin cậy",
  description:
    "MeowMarket là marketplace dịch vụ số cho thị trường Việt Nam với VPS, cloud server, gift card, thẻ game và nhiều sản phẩm số khác.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: "mieowshopsite@gmail.com",
  hotline: "1900 6868",
  socials: [
    { label: "Facebook", href: "#" },
    { label: "TikTok", href: "#" },
    { label: "Discord", href: "#" }
  ]
};

export const publicNavItems = [
  { label: "VPS", href: "/products?type=VPS", icon: faServer },
  { label: "Cloud", href: "/products?type=CLOUD", icon: faServer },
  { label: "Gift Card", href: "/products?type=GIFTCARD", icon: faGift },
  { label: "Thẻ Game", href: "/products?type=GAMECARD", icon: faTicket },
  { label: "Khuyến mãi", href: "/promotions", icon: faTags },
  { label: "Hỗ trợ", href: "/support", icon: faHeadset }
];

export const userSidebarItems = [
  { label: "Tổng quan", href: "/profile", icon: "chart-line" },
  { label: "Tài khoản", href: "/profile/account", icon: "user" },
  { label: "Đổi mật khẩu", href: "/profile/security", icon: "lock" },
  { label: "Đơn hàng", href: "/profile/orders", icon: "receipt" },
  { label: "Lịch sử thanh toán", href: "/profile/payments", icon: "wallet" },
  { label: "Sản phẩm đã mua", href: "/profile/purchases", icon: "bag-shopping" },
  { label: "Phiếu hỗ trợ", href: "/profile/tickets", icon: "life-ring" },
  { label: "Wishlist", href: "/profile/wishlist", icon: "heart" },
  { label: "Dịch vụ của tôi", href: "/profile/services", icon: "server" },
  { label: "Thông báo", href: "/profile/notifications", icon: "bell" }
];

export const adminSidebarItems = [
  { label: "Tổng quan", href: "/admin", icon: "chart-line" },
  { label: "Tài khoản admin", href: "/admin/account", icon: "user" },
  { label: "Đổi mật khẩu", href: "/admin/security", icon: "lock" },
  { label: "Sản phẩm", href: "/admin/products", icon: "box-open" },
  { label: "Danh mục", href: "/admin/categories", icon: "grid" },
  { label: "Banner", href: "/admin/banners", icon: "images" },
  { label: "Đơn hàng", href: "/admin/orders", icon: "receipt" },
  { label: "Thanh toán", href: "/admin/payments", icon: "credit-card" },
  { label: "Người dùng", href: "/admin/users", icon: "users" },
  { label: "Phiếu hỗ trợ", href: "/admin/tickets", icon: "life-ring" },
  { label: "Mã giảm giá", href: "/admin/coupons", icon: "ticket" },
  { label: "Gift Card", href: "/admin/giftcards", icon: "gift" },
  { label: "Dịch vụ", href: "/admin/services", icon: "server" },
  { label: "Thư viện media", href: "/admin/media", icon: "folder" },
  { label: "Quản lý SQL", href: "/admin/sql", icon: "database" },
  { label: "Thông báo", href: "/admin/notifications", icon: "bell" },
  { label: "SEO", href: "/admin/seo", icon: "magnifying-glass" },
  { label: "Nhật ký hệ thống", href: "/admin/audit-log", icon: "list-check" },
  { label: "Công cụ AI", href: "/admin/ai-tools", icon: "robot" },
  { label: "Cài đặt", href: "/admin/settings", icon: "gear" }
];

export const staffSidebarItems = [
  { label: "Tổng quan", href: "/staff", icon: "chart-line" },
  { label: "Tài khoản nhân viên", href: "/staff/account", icon: "user" },
  { label: "Đổi mật khẩu", href: "/staff/security", icon: "lock" },
  { label: "Đơn hàng", href: "/staff/orders", icon: "receipt" },
  { label: "Thanh toán", href: "/staff/payments", icon: "credit-card" },
  { label: "Phiếu hỗ trợ", href: "/staff/tickets", icon: "life-ring" },
  { label: "Gift Card", href: "/staff/giftcards", icon: "gift" },
  { label: "Dịch vụ", href: "/staff/services", icon: "server" },
  { label: "Thông báo", href: "/staff/notifications", icon: "bell" }
];
