import { randomUUID } from "node:crypto"
import {
  OrderStatus,
  Prisma,
  ProductStatus,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { resolveProductPurchase } from "@/features/catalog/product-purchase"
import type { CartItemConfiguration } from "@/features/cart/types"
import { createOrderSchema, type CreateOrderInput } from "@/features/orders/validations"
import { getOrderPaymentPlan } from "@/features/payment/services/prepare-payment"
import {
  mapPaymentMethodCodeToPrisma,
  mapPaymentProviderCodeToPrisma,
} from "@/features/payment/utils"
import type { PaymentMethodCode, PaymentProviderCode } from "@/features/payment/types"

export class OrderCreationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_INPUT"
      | "EMPTY_CART"
      | "PRODUCT_NOT_FOUND"
      | "INVALID_PRODUCT"
      | "INSUFFICIENT_WALLET_BALANCE"
      | "WALLET_UNAVAILABLE"
      | "ORDER_CREATION_FAILED",
    readonly status: number
  ) {
    super(message)
  }
}

export interface CreatedOrderSummary {
  id: string
  reference: string
  status: OrderStatus
  paymentMethod: PaymentMethodCode
  paymentProvider: PaymentProviderCode
  paymentStatus: "pending" | "succeeded" | "requires_action" | "failed"
  paymentInstructions: {
    title: string
    lines: string[]
  }
  currency: string
  subtotal: number
  total: number
  createdAt: string
  customer: {
    name: string
    email: string
    phone?: string
    note?: string
  }
  items: Array<{
    id: string
    slug: string
    name: string
    category: string
    priceValue: number
    priceLabel: string
    quantity: number
    tagline: string
    configuration?: CartItemConfiguration
  }>
}

function createOrderReference(prefix: "ORD" | "PAY") {
  return `NC-${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

export async function createUserOrder(userId: string, rawInput: CreateOrderInput) {
  if (!userId) {
    throw new OrderCreationError("Bạn cần đăng nhập để đặt hàng.", "INVALID_INPUT", 401)
  }

  const parsedInput = createOrderSchema.safeParse(rawInput)

  if (!parsedInput.success) {
    throw new OrderCreationError(
      parsedInput.error.issues[0]?.message ?? "Dữ liệu checkout chưa hợp lệ.",
      "INVALID_INPUT",
      400
    )
  }

  const payload = parsedInput.data

  if (payload.items.length === 0) {
    throw new OrderCreationError("Giỏ hàng đang trống.", "EMPTY_CART", 400)
  }

  const prisma = getPrismaClient()

  try {
    return await prisma.$transaction(async (tx) => {
      const uniqueSlugs = [...new Set(payload.items.map((item) => item.slug))]
      const products = await tx.product.findMany({
        where: {
          slug: {
            in: uniqueSlugs,
          },
          status: ProductStatus.ACTIVE,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          price: true,
          priceLabel: true,
          currency: true,
          category: true,
        },
      })

      if (products.length !== uniqueSlugs.length) {
        throw new OrderCreationError(
          "Một hoặc nhiều sản phẩm không còn khả dụng.",
          "PRODUCT_NOT_FOUND",
          404
        )
      }

      const productMap = new Map(products.map((product) => [product.slug, product]))
      const currency = products[0]?.currency ?? "VND"
      const paymentReference = createOrderReference("PAY")
      const paymentPlan = getOrderPaymentPlan(payload.paymentMethod, paymentReference)
      const normalizedItems = payload.items.map((item, index) => {
        const product = productMap.get(item.slug)

        if (!product) {
          throw new OrderCreationError(
            "Một hoặc nhiều sản phẩm không còn khả dụng.",
            "PRODUCT_NOT_FOUND",
            404
          )
        }

        if (product.currency !== currency) {
          throw new OrderCreationError(
            "Không thể checkout nhiều loại tiền tệ trong cùng một đơn hàng.",
            "INVALID_PRODUCT",
            400
          )
        }

        const resolvedPurchase = resolveProductPurchase(
          {
            slug: product.slug,
            name: product.name,
            priceValue: Number(product.price),
            priceLabel:
              product.priceLabel ??
              new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: product.currency,
                maximumFractionDigits: 0,
              }).format(Number(product.price)),
            category: product.category,
          },
          item.configuration
        )
        const quantity = item.configuration ? resolvedPurchase.quantity : item.quantity
        const unitPrice = resolvedPurchase.unitPrice

        return {
          lineId: item.id ?? `${product.slug}:${index + 1}`,
          id: product.id,
          slug: product.slug,
          name: item.configuration ? `${product.name} • ${resolvedPurchase.title}` : product.name,
          baseName: product.name,
          tagline: product.tagline ?? "",
          category: product.category,
          unitPrice,
          priceLabel: resolvedPurchase.unitPriceLabel,
          quantity,
          totalPrice: unitPrice * quantity,
          configuration: item.configuration
            ? {
                kind: item.configuration.kind,
                title: resolvedPurchase.title,
                summaryLines: resolvedPurchase.summaryLines,
                selection: item.configuration,
                allowQuantityAdjustment: resolvedPurchase.allowQuantityAdjustment,
              }
            : undefined,
        }
      })

      const totalAmount = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const totalAmountDecimal = new Prisma.Decimal(totalAmount)
      const wallet = await tx.wallet.upsert({
        where: {
          userId,
        },
        update: {},
        create: {
          userId,
          currency,
        },
        select: {
          id: true,
          balance: true,
          status: true,
          currency: true,
        },
      })

      if (paymentPlan.requiresWalletBalance) {
        if (wallet.status !== WalletStatus.ACTIVE || wallet.currency !== currency) {
          throw new OrderCreationError(
            "Ví hiện không khả dụng cho đơn hàng này.",
            "WALLET_UNAVAILABLE",
            409
          )
        }

        const walletUpdate = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            status: WalletStatus.ACTIVE,
            currency,
            balance: {
              gte: totalAmountDecimal,
            },
          },
          data: {
            balance: {
              decrement: totalAmountDecimal,
            },
          },
        })

        if (walletUpdate.count !== 1) {
          throw new OrderCreationError(
            "Số dư ví không đủ để thanh toán đơn hàng.",
            "INSUFFICIENT_WALLET_BALANCE",
            409
          )
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          status: paymentPlan.orderStatus,
          totalAmount: totalAmountDecimal,
          currency,
          customerName: payload.name,
          customerEmail: payload.email,
          customerPhone: payload.phone || null,
          paymentMethod: mapPaymentMethodCodeToPrisma(payload.paymentMethod),
          paymentProvider: mapPaymentProviderCodeToPrisma(paymentPlan.provider),
          paymentStatus:
            paymentPlan.paymentStatus === "succeeded"
              ? TransactionStatus.COMPLETED
              : paymentPlan.paymentStatus === "failed"
                ? TransactionStatus.FAILED
                : TransactionStatus.PENDING,
          paymentReference,
          note: payload.note || null,
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
        },
      })

      await tx.orderItem.createMany({
        data: normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.id,
          productName: item.name,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(item.totalPrice),
          metadata: item.configuration
            ? {
                lineId: item.lineId,
                configuration: item.configuration,
              }
            : {
                lineId: item.lineId,
              },
        })),
      })

      await tx.transaction.create({
        data: {
          userId,
          walletId: paymentPlan.requiresWalletBalance ? wallet.id : null,
          orderId: order.id,
          type: TransactionType.PAYMENT,
          paymentMethod: mapPaymentMethodCodeToPrisma(payload.paymentMethod),
          paymentProvider: mapPaymentProviderCodeToPrisma(paymentPlan.provider),
          status:
            paymentPlan.transactionStatus === TransactionStatus.COMPLETED
              ? TransactionStatus.COMPLETED
              : paymentPlan.transactionStatus === TransactionStatus.FAILED
                ? TransactionStatus.FAILED
                : TransactionStatus.PENDING,
          amount: totalAmountDecimal,
          currency,
          description: `Thanh toán đơn hàng ${paymentReference}`,
          reference: paymentReference,
          metadata: {
            customerEmail: payload.email,
            note: payload.note || null,
            configuredItems: normalizedItems
              .filter((item) => item.configuration)
              .map((item) => ({
                lineId: item.lineId,
                slug: item.slug,
                title: item.configuration?.title,
                summaryLines: item.configuration?.summaryLines,
              })),
          },
        },
      })

      return {
        id: order.id,
        reference: paymentReference,
        status: order.status,
        paymentMethod: payload.paymentMethod,
        paymentProvider: paymentPlan.provider,
        paymentStatus: paymentPlan.paymentStatus,
        paymentInstructions: paymentPlan.instructions,
        currency,
        subtotal: totalAmount,
        total: totalAmount,
        createdAt: order.createdAt.toISOString(),
        customer: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone || undefined,
          note: payload.note || undefined,
        },
        items: normalizedItems.map((item) => ({
          id: item.lineId,
          slug: item.slug,
          name: item.baseName,
          category: item.category,
          priceValue: item.unitPrice,
          priceLabel: item.priceLabel,
          quantity: item.quantity,
          tagline: item.tagline,
          configuration: item.configuration,
        })),
      } satisfies CreatedOrderSummary
    })
  } catch (error) {
    if (error instanceof OrderCreationError) {
      throw error
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Order creation failed.", error)
    }

    throw new OrderCreationError(
      "Không thể tạo đơn hàng lúc này. Vui lòng thử lại.",
      "ORDER_CREATION_FAILED",
      500
    )
  }
}
