import type { LucideIcon } from "lucide-react"
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ReceiptText,
  Settings2,
  Wallet,
} from "lucide-react"

export interface DashboardPageContent {
  title: string
  heading: string
  description: string
  href: string
  icon: LucideIcon
  group: "Workspace" | "Commerce"
}

export const dashboardPages = {
  overview: {
    title: "Overview",
    heading: "Dashboard",
    description: "Tổng quan ví, đơn hàng và thanh toán gần đây của tài khoản hiện tại.",
    href: "/dashboard",
    icon: BarChart3,
    group: "Workspace",
  },
  orders: {
    title: "Orders",
    heading: "Đơn hàng",
    description: "Theo dõi trạng thái đơn, thanh toán và lịch sử mua dịch vụ của bạn.",
    href: "/dashboard/orders",
    icon: ReceiptText,
    group: "Commerce",
  },
  wallet: {
    title: "Wallet",
    heading: "Ví & giao dịch",
    description: "Xem số dư, lịch sử giao dịch và tạo yêu cầu nạp ví cho phase payment tiếp theo.",
    href: "/dashboard/wallet",
    icon: Wallet,
    group: "Commerce",
  },
  purchasedProducts: {
    title: "Purchased",
    heading: "Sản phẩm đã mua",
    description: "Nhóm các dịch vụ hoặc digital goods mà tài khoản này đã từng sở hữu hoặc hoàn tất thanh toán.",
    href: "/dashboard/purchased-products",
    icon: Boxes,
    group: "Commerce",
  },
  billing: {
    title: "Billing",
    heading: "Billing",
    description: "Tổng quan thanh toán, lịch sử đối soát và các foundation cho payment provider tiếp theo.",
    href: "/dashboard/billing",
    icon: BadgeDollarSign,
    group: "Commerce",
  },
  settings: {
    title: "Settings",
    heading: "Cài đặt tài khoản",
    description: "Quản lý hồ sơ, trạng thái bảo mật và các tùy chọn nền cho trải nghiệm dashboard.",
    href: "/dashboard/settings",
    icon: Settings2,
    group: "Workspace",
  },
} satisfies Record<string, DashboardPageContent>

export const dashboardNavigation = Object.values(dashboardPages)

export function getDashboardPageMeta(pathname: string) {
  if (pathname === dashboardPages.overview.href) {
    return dashboardPages.overview
  }

  const page = dashboardNavigation.find(
    (item) => item.href !== dashboardPages.overview.href && pathname.startsWith(item.href)
  )

  if (page) {
    return page
  }

  return dashboardPages.overview
}
