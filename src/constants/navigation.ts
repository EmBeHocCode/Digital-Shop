import {
  faBolt,
  faBoxesStacked,
  faChartLine,
  faCloud,
  faGift,
  faHeadset,
  faImages,
  faLifeRing,
  faMagnifyingGlassChart,
  faMoneyBillTransfer,
  faReceipt,
  faRobot,
  faServer,
  faShieldHeart,
  faTicket,
  faUsers,
  faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";

export const publicNavigation = [
  { label: "VPS", href: "/products?type=VPS", icon: faServer },
  { label: "Cloud", href: "/products?type=CLOUD", icon: faCloud },
  { label: "Gift Card", href: "/products?type=GIFTCARD", icon: faGift },
  { label: "Thẻ Game", href: "/products?type=GAMECARD", icon: faTicket },
  { label: "Khuyến mãi", href: "/promotions", icon: faBolt },
  { label: "Hỗ trợ", href: "/support", icon: faHeadset }
];

export const publicQuickLinks = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Tra cứu đơn", href: "/order-lookup" },
  { label: "Chính sách", href: "/policies" },
  { label: "Liên hệ", href: "/contact" }
];

export const userDashboardNavigation = [
  { label: "Tổng quan", href: "/profile", icon: "chart-line" },
  { label: "Đơn hàng", href: "/profile/orders", icon: "receipt" },
  { label: "Thanh toán", href: "/profile/payments", icon: "wallet" },
  { label: "Phiếu hỗ trợ", href: "/profile/tickets", icon: "life-ring" },
  { label: "Yêu thích", href: "/profile/wishlist", icon: "heart" },
  { label: "Sản phẩm đã mua", href: "/profile/purchases", icon: "bag-shopping" },
  { label: "Dịch vụ của tôi", href: "/profile/services", icon: "server" },
  { label: "Thông báo", href: "/profile/notifications", icon: "bell" },
  { label: "Hồ sơ", href: "/profile/account", icon: "user" },
  { label: "Bảo mật", href: "/profile/security", icon: "lock" }
];

export const adminDashboardNavigation = [
  { label: "Tổng quan", href: "/admin", icon: faChartLine },
  { label: "Sản phẩm", href: "/admin/products", icon: faBoxesStacked },
  { label: "Danh mục", href: "/admin/categories", icon: faServer },
  { label: "Banner", href: "/admin/banners", icon: faImages },
  { label: "Đơn hàng", href: "/admin/orders", icon: faReceipt },
  { label: "Thanh toán", href: "/admin/payments", icon: faMoneyBillTransfer },
  { label: "Mã giảm giá", href: "/admin/coupons", icon: faTicket },
  { label: "Người dùng", href: "/admin/users", icon: faUsers },
  { label: "Phiếu hỗ trợ", href: "/admin/tickets", icon: faLifeRing },
  { label: "Gift Card", href: "/admin/giftcards", icon: faGift },
  { label: "Dịch vụ", href: "/admin/services", icon: faCloud },
  { label: "Thư viện media", href: "/admin/media", icon: faImages },
  { label: "Thông báo", href: "/admin/notifications", icon: faShieldHeart },
  { label: "SEO", href: "/admin/seo", icon: faMagnifyingGlassChart },
  { label: "Nhật ký hệ thống", href: "/admin/audit-log", icon: faWandMagicSparkles },
  { label: "Công cụ AI", href: "/admin/ai-tools", icon: faRobot },
  { label: "Cài đặt", href: "/admin/settings", icon: faServer }
];
