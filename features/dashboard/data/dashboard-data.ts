import type { LucideIcon } from "lucide-react"
import type { UserRole } from "@/lib/auth/role-helpers"
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ReceiptText,
  Settings2,
  UserRound,
  Wallet,
  Database,
} from "lucide-react"

export interface DashboardPageContent {
  title: string
  heading: string
  description: string
  href: string
  icon: LucideIcon
  group: "Workspace" | "Commerce"
  requiredRoles?: UserRole[]
}

export const dashboardPages = {
  overview: {
    title: "Overview",
    heading: "Dashboard",
    description: "Tổng quan ví, đơn hàng và thanh toán gần đây của tài khoản hiện tại.",
    href: "/dashboard",
    icon: BarChart3,
    group: "Workspace",
    requiredRoles: ["CUSTOMER"],
  },
  profile: {
    title: "Profile",
    heading: "Hồ sơ tài khoản",
    description: "Tổng quan tài khoản, thông tin liên hệ và các thiết lập cá nhân đang dùng trên marketplace.",
    href: "/dashboard/profile",
    icon: UserRound,
    group: "Workspace",
    requiredRoles: ["CUSTOMER"],
  },
  orders: {
    title: "Orders",
    heading: "Đơn hàng",
    description: "Theo dõi trạng thái đơn, thanh toán và lịch sử mua dịch vụ của bạn.",
    href: "/dashboard/orders",
    icon: ReceiptText,
    group: "Commerce",
    requiredRoles: ["CUSTOMER"],
  },
  wallet: {
    title: "Wallet",
    heading: "Ví & giao dịch",
    description: "Xem số dư, lịch sử giao dịch và tạo yêu cầu nạp ví cho phase payment tiếp theo.",
    href: "/dashboard/wallet",
    icon: Wallet,
    group: "Commerce",
    requiredRoles: ["CUSTOMER"],
  },
  purchasedProducts: {
    title: "Purchased",
    heading: "Sản phẩm đã mua",
    description: "Nhóm các dịch vụ hoặc digital goods mà tài khoản này đã từng sở hữu hoặc hoàn tất thanh toán.",
    href: "/dashboard/purchased-products",
    icon: Boxes,
    group: "Commerce",
    requiredRoles: ["CUSTOMER"],
  },
  billing: {
    title: "Billing",
    heading: "Billing",
    description: "Tổng quan thanh toán, lịch sử đối soát và các foundation cho payment provider tiếp theo.",
    href: "/dashboard/billing",
    icon: BadgeDollarSign,
    group: "Commerce",
    requiredRoles: ["CUSTOMER"],
  },
  settings: {
    title: "Settings",
    heading: "Cài đặt tài khoản",
    description: "Quản lý hồ sơ, trạng thái bảo mật và các tùy chọn nền cho trải nghiệm dashboard.",
    href: "/dashboard/settings",
    icon: Settings2,
    group: "Workspace",
    requiredRoles: ["CUSTOMER"],
  },
  sqlManager: {
    title: "SQL Manager",
    heading: "Database Manager",
    description: "Browse and manage database tables, view data, and execute queries.",
    href: "/dashboard/admin/sql-manager",
    icon: Database,
    group: "Workspace",
    requiredRoles: ["ADMIN"],
  },
} satisfies Record<string, DashboardPageContent>

export const dashboardNavigation = Object.values(dashboardPages)

/**
 * Get allowed navigation items for a specific role
 */
export function getNavigationForRole(role?: string): DashboardPageContent[] {
  if (!role) return []

  return dashboardNavigation.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true
    const itemRequiredRoles: string[] = item.requiredRoles
    return itemRequiredRoles.includes(role)
  })
}

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
