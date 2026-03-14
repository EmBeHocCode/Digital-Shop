import { OrderStatus, Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface PurchasedProductSummary {
  productId: string
  slug: string
  name: string
  category: string
  domain: string
  totalQuantity: number
  orderCount: number
  totalSpent: number
  totalSpentLabel: string
  lastPurchasedAt: Date
}

const purchasedProductSelect = {
  productId: true,
  productName: true,
  quantity: true,
  totalPrice: true,
  order: {
    select: {
      id: true,
      createdAt: true,
    },
  },
  product: {
    select: {
      slug: true,
      category: true,
      domain: true,
    },
  },
} satisfies Prisma.OrderItemSelect

export const getPurchasedProducts = cache(async (userId: string) => {
  if (!userId) {
    return [] as PurchasedProductSummary[]
  }

  try {
    const prisma = getPrismaClient()
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: OrderStatus.COMPLETED,
        },
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
      select: purchasedProductSelect,
    })

    const purchasedProducts = new Map<string, PurchasedProductSummary>()

    for (const item of orderItems) {
      const existingProduct = purchasedProducts.get(item.productId)
      const totalPrice = Number(item.totalPrice)

      if (existingProduct) {
        existingProduct.totalQuantity += item.quantity
        existingProduct.orderCount += 1
        existingProduct.totalSpent += totalPrice
        existingProduct.totalSpentLabel = formatCurrency(existingProduct.totalSpent)

        if (item.order.createdAt > existingProduct.lastPurchasedAt) {
          existingProduct.lastPurchasedAt = item.order.createdAt
        }

        continue
      }

      purchasedProducts.set(item.productId, {
        productId: item.productId,
        slug: item.product.slug,
        name: item.productName,
        category: item.product.category,
        domain: item.product.domain,
        totalQuantity: item.quantity,
        orderCount: 1,
        totalSpent: totalPrice,
        totalSpentLabel: formatCurrency(totalPrice),
        lastPurchasedAt: item.order.createdAt,
      })
    }

    return [...purchasedProducts.values()].sort(
      (left, right) => right.lastPurchasedAt.getTime() - left.lastPurchasedAt.getTime()
    )
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load purchased products.", error)
    }

    return [] as PurchasedProductSummary[]
  }
})
