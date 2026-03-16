import { Prisma, type UserRole } from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface AdminUserFilters {
  search?: string
  role?: UserRole | "ALL"
  state?: "ACTIVE" | "INACTIVE" | "ALL"
  page?: number
  pageSize?: number
}

export interface AdminUserRow {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  walletBalanceLabel: string
  walletStatus: string | null
  orderCount: number
  createdAt: Date
}

export interface AdminUsersResult {
  items: AdminUserRow[]
  totalCount: number
  page: number
  pageSize: number
  summary: {
    total: number
    customers: number
    teamMembers: number
    inactive: number
    verifiedEmails: number
  }
}

export interface AdminUserDetail {
  id: string
  name: string
  email: string
  phone: string | null
  image: string | null
  role: UserRole
  isActive: boolean
  emailVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  wallet: {
    id: string | null
    balanceLabel: string
    status: string | null
  }
  preferences: {
    preferredTheme: string | null
    locale: string | null
    currency: string
    marketingEmails: boolean
    orderEmails: boolean
    billingEmails: boolean
  } | null
  recentOrders: Array<{
    id: string
    status: string
    paymentStatus: string
    totalAmountLabel: string
    createdAt: Date
  }>
  recentSecurityEvents: Array<{
    id: string
    type: string
    ipAddress: string | null
    createdAt: Date
  }>
}

function buildSearchWhere(search?: string): Prisma.UserWhereInput {
  if (!search?.trim()) {
    return {}
  }

  const value = search.trim()

  return {
    OR: [
      { name: { contains: value, mode: "insensitive" } },
      { email: { contains: value, mode: "insensitive" } },
      { phone: { contains: value, mode: "insensitive" } },
    ],
  }
}

function buildUserWhere(filters: AdminUserFilters): Prisma.UserWhereInput {
  return {
    ...buildSearchWhere(filters.search),
    ...(filters.role && filters.role !== "ALL" ? { role: filters.role } : {}),
    ...(filters.state === "ACTIVE"
      ? { isActive: true }
      : filters.state === "INACTIVE"
        ? { isActive: false }
        : {}),
  }
}

export async function getAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUsersResult> {
  const prisma = getPrismaClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20))
  const where = buildUserWhere(filters)

  const [items, totalCount, customers, inactive, verifiedEmails, teamMembers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            currency: true,
            status: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, role: "CUSTOMER" } }),
    prisma.user.count({ where: { ...where, isActive: false } }),
    prisma.user.count({ where: { ...where, emailVerified: { not: null } } }),
    prisma.user.count({
      where: {
        ...where,
        role: {
          in: ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"],
        },
      },
    }),
  ])

  return {
    items: items.map((user) => ({
      id: user.id,
      name: user.name || "NexCloud User",
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      walletBalanceLabel: formatCurrency(
        Number(user.wallet?.balance ?? 0),
        user.wallet?.currency ?? "VND"
      ),
      walletStatus: user.wallet?.status ?? null,
      orderCount: user._count.orders,
      createdAt: user.createdAt,
    })),
    totalCount,
    page,
    pageSize,
    summary: {
      total: totalCount,
      customers,
      teamMembers,
      inactive,
      verifiedEmails,
    },
  }
}

export async function getAdminUserById(userId: string): Promise<AdminUserDetail | null> {
  if (!userId) {
    return null
  }

  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          currency: true,
          status: true,
        },
      },
      preference: {
        select: {
          preferredTheme: true,
          locale: true,
          currency: true,
          marketingEmails: true,
          orderEmails: true,
          billingEmails: true,
        },
      },
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
        },
      },
      securityEvents: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          type: true,
          ipAddress: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name || "NexCloud User",
    email: user.email,
    phone: user.phone,
    image: user.image,
    role: user.role,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    wallet: {
      id: user.wallet?.id ?? null,
      balanceLabel: formatCurrency(Number(user.wallet?.balance ?? 0), user.wallet?.currency ?? "VND"),
      status: user.wallet?.status ?? null,
    },
    preferences: user.preference
      ? {
          preferredTheme: user.preference.preferredTheme,
          locale: user.preference.locale,
          currency: user.preference.currency,
          marketingEmails: user.preference.marketingEmails,
          orderEmails: user.preference.orderEmails,
          billingEmails: user.preference.billingEmails,
        }
      : null,
    recentOrders: user.orders.map((order) => ({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmountLabel: formatCurrency(Number(order.totalAmount), order.currency),
      createdAt: order.createdAt,
    })),
    recentSecurityEvents: user.securityEvents.map((event) => ({
      id: event.id,
      type: event.type,
      ipAddress: event.ipAddress,
      createdAt: event.createdAt,
    })),
  }
}
