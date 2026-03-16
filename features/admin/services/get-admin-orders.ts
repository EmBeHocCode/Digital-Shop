import { Prisma, type OrderStatus, type TransactionStatus } from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"
import type { CartItemConfiguration } from "@/features/cart/types"
import { parseOrderItemConfiguration } from "@/features/orders/order-item-configuration"

export interface AdminOrderFilters {
  search?: string
  status?: OrderStatus | "ALL"
  paymentStatus?: TransactionStatus | "ALL"
  page?: number
  pageSize?: number
}

export interface AdminOrderRow {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  paymentReference: string | null
  totalAmount: number
  totalAmountLabel: string
  itemsCount: number
  transactionsCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AdminOrderSummary {
  total: number
  pending: number
  processing: number
  completed: number
  cancelled: number
  refunded: number
  paymentPending: number
}

export interface AdminOrdersResult {
  items: AdminOrderRow[]
  totalCount: number
  page: number
  pageSize: number
  summary: AdminOrderSummary
}

export interface AdminOrderDetail {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  paymentProvider: string
  paymentReference: string | null
  note: string | null
  totalAmount: number
  totalAmountLabel: string
  currency: string
  createdAt: Date
  updatedAt: Date
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  items: Array<{
    id: string
    productId: string
    productSlug: string
    productName: string
    quantity: number
    unitPrice: number
    unitPriceLabel: string
    totalPrice: number
    totalPriceLabel: string
    configuration?: CartItemConfiguration
  }>
  transactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    amountLabel: string
    reference: string | null
    description: string | null
    createdAt: Date
  }>
  refundRequests: Array<{
    id: string
    status: string
    amountLabel: string
    reason: string
    createdAt: Date
  }>
}

function buildSearchWhere(search?: string): Prisma.OrderWhereInput {
  if (!search?.trim()) {
    return {}
  }

  const value = search.trim()
  const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
  const orConditions: Prisma.OrderWhereInput[] = [
    { paymentReference: { contains: value, mode: "insensitive" } },
    { customerName: { contains: value, mode: "insensitive" } },
    { customerEmail: { contains: value, mode: "insensitive" } },
    { customerPhone: { contains: value, mode: "insensitive" } },
    { user: { is: { name: { contains: value, mode: "insensitive" } } } },
    { user: { is: { email: { contains: value, mode: "insensitive" } } } },
  ]

  if (isUuidLike) {
    orConditions.unshift({ id: value })
  }

  return {
    OR: orConditions,
  }
}

function buildOrderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  return {
    ...buildSearchWhere(filters.search),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.paymentStatus && filters.paymentStatus !== "ALL"
      ? { paymentStatus: filters.paymentStatus }
      : {}),
  }
}

const adminOrderListSelect = {
  id: true,
  userId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentReference: true,
  totalAmount: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      items: true,
      transactions: true,
    },
  },
} satisfies Prisma.OrderSelect

const adminOrderDetailSelect = {
  id: true,
  userId: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentProvider: true,
  paymentReference: true,
  note: true,
  totalAmount: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  user: {
    select: {
      name: true,
      email: true,
      phone: true,
    },
  },
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      productId: true,
      productName: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      metadata: true,
      product: {
        select: {
          slug: true,
        },
      },
    },
  },
  transactions: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      reference: true,
      description: true,
      createdAt: true,
    },
  },
  refundRequests: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      reason: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect

export async function getAdminOrders(filters: AdminOrderFilters = {}): Promise<AdminOrdersResult> {
  const prisma = getPrismaClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20))
  const where = buildOrderWhere(filters)

  const [items, totalCount, pending, processing, completed, cancelled, refunded, paymentPending] =
    await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: adminOrderListSelect,
      }),
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: "PENDING" } }),
      prisma.order.count({ where: { ...where, status: "PROCESSING" } }),
      prisma.order.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.order.count({ where: { ...where, status: "CANCELLED" } }),
      prisma.order.count({ where: { ...where, status: "REFUNDED" } }),
      prisma.order.count({ where: { ...where, paymentStatus: "PENDING" } }),
    ])

  return {
    items: items.map((order) => ({
      id: order.id,
      userId: order.userId,
      customerName: order.customerName || order.user.name || "Khách hàng",
      customerEmail: order.customerEmail || order.user.email,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      totalAmount: Number(order.totalAmount),
      totalAmountLabel: formatCurrency(Number(order.totalAmount), order.currency),
      itemsCount: order._count.items,
      transactionsCount: order._count.transactions,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    totalCount,
    page,
    pageSize,
    summary: {
      total: totalCount,
      pending,
      processing,
      completed,
      cancelled,
      refunded,
      paymentPending,
    },
  }
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrderDetail | null> {
  if (!orderId) {
    return null
  }

  const prisma = getPrismaClient()
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: adminOrderDetailSelect,
  })

  if (!order) {
    return null
  }

  return {
    id: order.id,
    userId: order.userId,
    userName: order.user.name || "NexCloud User",
    userEmail: order.user.email,
    userPhone: order.user.phone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    note: order.note,
    totalAmount: Number(order.totalAmount),
    totalAmountLabel: formatCurrency(Number(order.totalAmount), order.currency),
    currency: order.currency,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      unitPriceLabel: formatCurrency(Number(item.unitPrice), order.currency),
      totalPrice: Number(item.totalPrice),
      totalPriceLabel: formatCurrency(Number(item.totalPrice), order.currency),
      configuration: parseOrderItemConfiguration(item.metadata),
    })),
    transactions: order.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: Number(transaction.amount),
      amountLabel: formatCurrency(Number(transaction.amount), transaction.currency),
      reference: transaction.reference,
      description: transaction.description,
      createdAt: transaction.createdAt,
    })),
    refundRequests: order.refundRequests.map((request) => ({
      id: request.id,
      status: request.status,
      amountLabel: formatCurrency(Number(request.amount), request.currency),
      reason: request.reason,
      createdAt: request.createdAt,
    })),
  }
}
