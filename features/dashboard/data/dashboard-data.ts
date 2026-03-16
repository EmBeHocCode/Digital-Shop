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
  group: "Workspace" | "Commerce" | "Admin"
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
    requiredRoles: ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  profile: {
    title: "Profile",
    heading: "Hồ sơ tài khoản",
    description: "Tổng quan tài khoản, thông tin liên hệ và các thiết lập cá nhân đang dùng trên marketplace.",
    href: "/dashboard/profile",
    icon: UserRound,
    group: "Workspace",
    requiredRoles: ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  orders: {
    title: "Orders",
    heading: "Đơn hàng",
    description: "Theo dõi trạng thái đơn, thanh toán và lịch sử mua dịch vụ của bạn.",
    href: "/dashboard/orders",
    icon: ReceiptText,
    group: "Commerce",
    requiredRoles: ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
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
    requiredRoles: ["CUSTOMER", "MANAGER", "ADMIN", "SUPERADMIN"],
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
    group: "Admin",
    requiredRoles: ["ADMIN", "SUPERADMIN"],
  },
  adminHome: {
    title: "Admin Hub",
    heading: "Admin Operations",
    description: "Trung tâm vận hành nội bộ cho đơn hàng, khách hàng, ví, sản phẩm và các tác vụ backoffice.",
    href: "/dashboard/admin",
    icon: BarChart3,
    group: "Admin",
    requiredRoles: ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  adminOrders: {
    title: "Admin Orders",
    heading: "Quản lý đơn hàng",
    description: "Danh sách và thao tác vận hành đơn hàng toàn hệ thống.",
    href: "/dashboard/admin/orders",
    icon: ReceiptText,
    group: "Admin",
    requiredRoles: ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  adminUsers: {
    title: "Admin Users",
    heading: "Khách hàng & người dùng",
    description: "Quản lý vai trò, trạng thái hoạt động và hồ sơ tài khoản của người dùng hệ thống.",
    href: "/dashboard/admin/users",
    icon: UserRound,
    group: "Admin",
    requiredRoles: ["ADMIN", "SUPERADMIN"],
  },
  adminWallet: {
    title: "Admin Wallet",
    heading: "Ví & giao dịch hệ thống",
    description: "Theo dõi số dư ví, lịch sử giao dịch và các điều chỉnh vận hành.",
    href: "/dashboard/admin/wallet",
    icon: Wallet,
    group: "Admin",
    requiredRoles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  adminProducts: {
    title: "Admin Products",
    heading: "Quản lý sản phẩm",
    description: "Quản lý danh mục dịch vụ, trạng thái publish và pricing foundation của storefront.",
    href: "/dashboard/admin/products",
    icon: Boxes,
    group: "Admin",
    requiredRoles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
} satisfies Record<string, DashboardPageContent>

export const dashboardNavigation = Object.values(dashboardPages)

const dashboardNavigationOrder = [
  "/dashboard",
  "/dashboard/profile",
  "/dashboard/orders",
  "/dashboard/wallet",
  "/dashboard/purchased-products",
  "/dashboard/billing",
  "/dashboard/settings",
  "/dashboard/admin",
  "/dashboard/admin/orders",
  "/dashboard/admin/users",
  "/dashboard/admin/wallet",
  "/dashboard/admin/products",
  "/dashboard/admin/sql-manager",
]

/**
 * Get allowed navigation items for a specific role
 */
export function getNavigationForRole(role?: string): DashboardPageContent[] {
  if (!role) return []

  return dashboardNavigation
    .filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true
    const itemRequiredRoles: string[] = item.requiredRoles
    return itemRequiredRoles.includes(role)
    })
    .sort(
      (left, right) =>
        dashboardNavigationOrder.indexOf(left.href) - dashboardNavigationOrder.indexOf(right.href)
    )
}

export function getDashboardPageMeta(pathname: string) {
  if (pathname === dashboardPages.overview.href) {
    return dashboardPages.overview
  }

  const page = [...dashboardNavigation]
    .filter((item) => item.href !== dashboardPages.overview.href)
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname.startsWith(item.href))

  if (page) {
    return page
  }

  return dashboardPages.overview
}
