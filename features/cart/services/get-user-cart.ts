import { Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import type { CartItemConfiguration } from "@/features/cart/types"

export interface PersistedCartItemSummary {
  id: string
  lineId: string
  slug: string
  name: string
  quantity: number
  unitPrice: number
  configuration?: CartItemConfiguration
}

export interface PersistedUserCart {
  id: string
  currency: string
  status: string
  updatedAt: Date
  items: PersistedCartItemSummary[]
}

const userCartSelect = {
  id: true,
  currency: true,
  status: true,
  updatedAt: true,
  items: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      lineId: true,
      productName: true,
      quantity: true,
      unitPrice: true,
      metadata: true,
      product: {
        select: {
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.CartSelect

type PersistedCartRecord = Prisma.CartGetPayload<{
  select: typeof userCartSelect
}>

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isStringArray(value: Prisma.JsonValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function parseConfiguration(metadata: Prisma.JsonValue | null): CartItemConfiguration | undefined {
  if (!isJsonObject(metadata)) {
    return undefined
  }

  const rawConfiguration = isJsonObject(metadata.configuration) ? metadata.configuration : metadata
  const title = rawConfiguration.title
  const kind = rawConfiguration.kind
  const summaryLines = rawConfiguration.summaryLines
  const selection = rawConfiguration.selection
  const allowQuantityAdjustment = rawConfiguration.allowQuantityAdjustment

  if (
    typeof title !== "string" ||
    typeof kind !== "string" ||
    !isStringArray(summaryLines) ||
    !selection
  ) {
    return undefined
  }

  return {
    kind: kind as CartItemConfiguration["kind"],
    title,
    summaryLines,
    selection: selection as CartItemConfiguration["selection"],
    allowQuantityAdjustment:
      typeof allowQuantityAdjustment === "boolean" ? allowQuantityAdjustment : true,
  }
}

function mapCart(record: PersistedCartRecord): PersistedUserCart {
  return {
    id: record.id,
    currency: record.currency,
    status: record.status,
    updatedAt: record.updatedAt,
    items: record.items.map((item) => ({
      id: item.id,
      lineId: item.lineId,
      slug: item.product.slug,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      configuration: parseConfiguration(item.metadata),
    })),
  }
}

export const getUserCart = cache(async (userId: string) => {
  if (!userId || !process.env.DATABASE_URL) {
    return null as PersistedUserCart | null
  }

  try {
    const prisma = getPrismaClient()
    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
      select: userCartSelect,
    })

    return cart ? mapCart(cart) : null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load persisted user cart.", error)
    }

    return null as PersistedUserCart | null
  }
})
