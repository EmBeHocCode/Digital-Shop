import { OrderStatus, ProductStatus, TransactionStatus, UserRole } from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface AdminOverviewOrder {
  id: string
  customerName: string
  customerEmail: string
  status: string
  paymentStatus: string
  totalAmountLabel: string
  createdAt: Date
}

export interface AdminOverviewUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date
}

export interface AdminOverviewSummary {
  pendingOrders: number
  processingOrders: number
  totalUsers: number
  activeUsers: number
  activeProducts: number
  draftProducts: number
  pendingTransactions: number
  walletExposure: number
  walletExposureLabel: string
  recentOrders: AdminOverviewOrder[]
  recentUsers: AdminOverviewUser[]
}

export async function getAdminOverview(): Promise<AdminOverviewSummary> {
  const prisma = getPrismaClient()

  const [
    pendingOrders,
    processingOrders,
    totalUsers,
    activeUsers,
    activeProducts,
    draftProducts,
    pendingTransactions,
    walletAggregate,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
    prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
    prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
    }),
    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ])

  const walletExposure = Number(walletAggregate._sum.balance ?? 0)

  return {
    pendingOrders,
    processingOrders,
    totalUsers,
    activeUsers,
    activeProducts,
    draftProducts,
    pendingTransactions,
    walletExposure,
    walletExposureLabel: formatCurrency(walletExposure),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      customerName: order.customerName || order.user.name || "Khách hàng",
      customerEmail: order.customerEmail || order.user.email,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmountLabel: formatCurrency(Number(order.totalAmount), order.currency),
      createdAt: order.createdAt,
    })),
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name || "NexCloud User",
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
  }
}
