import { Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"
import type { CartItemConfiguration } from "@/features/cart/types"
import { parseOrderItemConfiguration } from "@/features/orders/order-item-configuration"
import {
  getPaymentInstructions,
  mapPrismaPaymentMethodToCode,
  mapPrismaPaymentProviderToCode,
  mapTransactionStatusToPaymentIntentStatus,
} from "@/features/payment/utils"
import type { PaymentIntentStatus, PaymentMethodCode, PaymentProviderCode } from "@/features/payment/types"

export interface UserOrderItemSummary {
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
}

export interface UserOrderTransactionSummary {
  id: string
  type: string
  status: string
  amount: number
  amountLabel: string
  reference: string | null
  createdAt: Date
}

export interface UserOrderSummary {
  id: string
  status: string
  totalAmount: number
  totalAmountLabel: string
  currency: string
  note: string | null
  createdAt: Date
  updatedAt: Date
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  paymentMethod: PaymentMethodCode | null
  paymentProvider: PaymentProviderCode | null
  paymentStatus: PaymentIntentStatus
  paymentReference: string | null
  paymentInstructions: {
    title: string
    lines: string[]
  }
  items: UserOrderItemSummary[]
  transactions: UserOrderTransactionSummary[]
}

const userOrderSelect = {
  id: true,
  status: true,
  totalAmount: true,
  currency: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  paymentMethod: true,
  paymentProvider: true,
  paymentStatus: true,
  paymentReference: true,
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
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect

type UserOrderRecord = Prisma.OrderGetPayload<{
  select: typeof userOrderSelect
}>

function mapOrder(record: UserOrderRecord): UserOrderSummary {
  const paymentMethod = mapPrismaPaymentMethodToCode(record.paymentMethod)
  const paymentProvider = mapPrismaPaymentProviderToCode(record.paymentProvider)
  const paymentStatus = mapTransactionStatusToPaymentIntentStatus(record.paymentStatus)

  return {
    id: record.id,
    status: record.status,
    totalAmount: Number(record.totalAmount),
    totalAmountLabel: formatCurrency(Number(record.totalAmount), record.currency),
    currency: record.currency,
    note: record.note,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    customerPhone: record.customerPhone,
    paymentMethod,
    paymentProvider,
    paymentStatus,
    paymentReference: record.paymentReference,
    paymentInstructions: getPaymentInstructions(
      paymentMethod ?? "manual_confirmation",
      paymentProvider ?? "manual_review",
      paymentStatus,
      record.paymentReference
    ),
    items: record.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      unitPriceLabel: formatCurrency(Number(item.unitPrice), record.currency),
      totalPrice: Number(item.totalPrice),
      totalPriceLabel: formatCurrency(Number(item.totalPrice), record.currency),
      configuration: parseOrderItemConfiguration(item.metadata),
    })),
    transactions: record.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: Number(transaction.amount),
      amountLabel: formatCurrency(Number(transaction.amount), transaction.currency),
      reference: transaction.reference,
      createdAt: transaction.createdAt,
    })),
  }
}

export const getUserOrders = cache(async (userId: string, take = 20) => {
  if (!userId) {
    return [] as UserOrderSummary[]
  }

  try {
    const prisma = getPrismaClient()
    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      select: userOrderSelect,
    })

    return orders.map(mapOrder)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load user orders.", error)
    }

    return [] as UserOrderSummary[]
  }
})

export const getUserOrderById = cache(async (userId: string, orderId: string) => {
  if (!userId || !orderId) {
    return null as UserOrderSummary | null
  }

  try {
    const prisma = getPrismaClient()
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: userOrderSelect,
    })

    return order ? mapOrder(order) : null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load user order.", error)
    }

    return null as UserOrderSummary | null
  }
})
