import { OrderStatus, Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { parseOrderItemConfiguration } from "@/features/orders/order-item-configuration"
import { formatCurrency } from "@/lib/utils"
import {
  mapPrismaPaymentMethodToCode,
  mapPrismaPaymentProviderToCode,
  mapTransactionStatusToPaymentIntentStatus,
} from "@/features/payment/utils"
import type {
  PaymentIntentStatus,
  PaymentMethodCode,
  PaymentProviderCode,
} from "@/features/payment/types"
import type { CartItemConfiguration } from "@/features/cart/types"

export interface PurchasedProductProvisionRecord {
  id: string
  status: string
  providerKey: string | null
  region: string | null
  config: Prisma.JsonValue | null
  accessData: Prisma.JsonValue | null
  provisionedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PurchasedProductDeliveryRecord {
  id: string
  status: string
  channel: string | null
  payload: Prisma.JsonValue | null
  deliveredAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PurchasedProductOrderLineDetail {
  id: string
  orderId: string
  orderReference: string | null
  orderCreatedAt: Date
  orderStatus: string
  paymentStatus: PaymentIntentStatus
  paymentMethod: PaymentMethodCode | null
  paymentProvider: PaymentProviderCode | null
  productName: string
  quantity: number
  unitPrice: number
  unitPriceLabel: string
  totalPrice: number
  totalPriceLabel: string
  configuration?: CartItemConfiguration
  serviceProvisions: PurchasedProductProvisionRecord[]
  digitalDeliveries: PurchasedProductDeliveryRecord[]
}

export interface PurchasedProductDetail {
  productId: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  category: string
  domain: string
  totalQuantity: number
  orderCount: number
  totalSpent: number
  totalSpentLabel: string
  lastPurchasedAt: Date
  latestConfiguration?: CartItemConfiguration
  latestProvisionStatus: string | null
  latestDeliveryStatus: string | null
  lineItems: PurchasedProductOrderLineDetail[]
}

const purchasedProductDetailSelect = {
  id: true,
  productName: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  metadata: true,
  order: {
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentReference: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentProvider: true,
    },
  },
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      category: true,
      domain: true,
    },
  },
  serviceProvisions: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      providerKey: true,
      region: true,
      config: true,
      accessData: true,
      provisionedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  digitalDeliveries: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      channel: true,
      payload: true,
      deliveredAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.OrderItemSelect

type PurchasedProductDetailRecord = Prisma.OrderItemGetPayload<{
  select: typeof purchasedProductDetailSelect
}>

function mapPurchasedProductLineItem(
  item: PurchasedProductDetailRecord
): PurchasedProductOrderLineDetail {
  return {
    id: item.id,
    orderId: item.order.id,
    orderReference: item.order.paymentReference,
    orderCreatedAt: item.order.createdAt,
    orderStatus: item.order.status,
    paymentStatus: mapTransactionStatusToPaymentIntentStatus(item.order.paymentStatus),
    paymentMethod: mapPrismaPaymentMethodToCode(item.order.paymentMethod),
    paymentProvider: mapPrismaPaymentProviderToCode(item.order.paymentProvider),
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    unitPriceLabel: formatCurrency(Number(item.unitPrice)),
    totalPrice: Number(item.totalPrice),
    totalPriceLabel: formatCurrency(Number(item.totalPrice)),
    configuration: parseOrderItemConfiguration(item.metadata),
    serviceProvisions: item.serviceProvisions.map((provision) => ({
      ...provision,
    })),
    digitalDeliveries: item.digitalDeliveries.map((delivery) => ({
      ...delivery,
    })),
  }
}

export const getPurchasedProductDetail = cache(
  async (userId: string, productId: string) => {
    if (!userId || !productId) {
      return null as PurchasedProductDetail | null
    }

    try {
      const prisma = getPrismaClient()
      const items = await prisma.orderItem.findMany({
        where: {
          productId,
          order: {
            userId,
            status: OrderStatus.COMPLETED,
          },
        },
        orderBy: [
          {
            order: {
              createdAt: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        select: purchasedProductDetailSelect,
      })

      if (items.length === 0) {
        return null as PurchasedProductDetail | null
      }

      const firstItem = items[0]
      const totalSpent = items.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      )
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      const lineItems = items.map(mapPurchasedProductLineItem)
      const latestConfiguration = lineItems.find((item) => item.configuration)?.configuration
      const latestProvisionStatus =
        lineItems.flatMap((item) => item.serviceProvisions)[0]?.status ?? null
      const latestDeliveryStatus =
        lineItems.flatMap((item) => item.digitalDeliveries)[0]?.status ?? null
      const uniqueOrderCount = new Set(items.map((item) => item.order.id)).size

      return {
        productId: firstItem.product.id,
        slug: firstItem.product.slug,
        name: firstItem.product.name,
        tagline: firstItem.product.tagline,
        description: firstItem.product.description,
        category: firstItem.product.category,
        domain: firstItem.product.domain,
        totalQuantity,
        orderCount: uniqueOrderCount,
        totalSpent,
        totalSpentLabel: formatCurrency(totalSpent),
        lastPurchasedAt: firstItem.order.createdAt,
        latestConfiguration,
        latestProvisionStatus,
        latestDeliveryStatus,
        lineItems,
      } satisfies PurchasedProductDetail
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load purchased product detail.", error)
      }

      return null as PurchasedProductDetail | null
    }
  }
)
