import {
  InventoryNumberStatus,
  Prisma,
  ProductOptionType,
  ProductStatus,
} from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { catalogProductContent } from "@/features/catalog/data/catalog-content"
import { getCatalogIcon } from "@/features/catalog/data/catalog-data"
import { getProductPurchaseExperience } from "@/features/catalog/product-purchase"
import type { CatalogService } from "@/features/catalog/types"
import { getProductOperationalBaseline } from "@/features/ai/data/operational-baseline"

export type ProductCommerceSource = "database" | "fallback"

export interface ProductCommerceOptionValue {
  key: string
  label: string
  description: string | null
  priceAdjustment: number
  badge: string | null
  isDefault: boolean
  sortOrder: number
  metadata: Prisma.JsonValue | null
}

export interface ProductCommerceOptionGroup {
  key: string
  label: string
  type: ProductOptionType
  helperText: string | null
  sortOrder: number
  values: ProductCommerceOptionValue[]
}

export interface ProductCommerceDenomination {
  key: string
  label: string
  amount: number
  note: string | null
  isDefault: boolean
  sortOrder: number
}

export interface ProductCommerceInventoryNumber {
  key: string
  providerKey: string
  categoryKey: string
  value: string
  price: number
  tags: string[]
  status: InventoryNumberStatus
  sortOrder: number
}

export interface ProductInventorySnapshot {
  onHand: number
  reserved: number
  sold: number
  available: number
  updatedAt: Date | null
}

export interface ProductCommerceContext {
  source: ProductCommerceSource
  product: CatalogService | null
  optionGroups: ProductCommerceOptionGroup[]
  denominations: ProductCommerceDenomination[]
  inventoryNumbers: ProductCommerceInventoryNumber[]
  inventory: ProductInventorySnapshot | null
}

const productCommerceSelect = {
  slug: true,
  name: true,
  tagline: true,
  description: true,
  price: true,
  priceLabel: true,
  currency: true,
  domain: true,
  category: true,
  imageUrl: true,
  isFeatured: true,
  sortOrder: true,
  metadata: true,
  optionGroups: {
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      key: true,
      label: true,
      type: true,
      helperText: true,
      sortOrder: true,
      values: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          key: true,
          label: true,
          description: true,
          priceAdjustment: true,
          badge: true,
          isDefault: true,
          sortOrder: true,
          metadata: true,
        },
      },
    },
  },
  denominations: {
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      key: true,
      label: true,
      amount: true,
      note: true,
      isDefault: true,
      sortOrder: true,
    },
  },
  inventoryNumbers: {
    where: {
      status: InventoryNumberStatus.AVAILABLE,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      key: true,
      providerKey: true,
      categoryKey: true,
      value: true,
      price: true,
      tags: true,
      status: true,
      sortOrder: true,
    },
  },
  inventoryBalances: {
    where: {
      scopeKey: "default",
    },
    take: 1,
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      onHand: true,
      reserved: true,
      sold: true,
      available: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ProductSelect

type ProductCommerceRecord = Prisma.ProductGetPayload<{
  select: typeof productCommerceSelect
}>

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function parseProductMetadata(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      features: [] as string[],
      highlights: [] as Array<{ label: string; value: string }>,
      idealFor: [] as string[],
      operations: [] as string[],
    }
  }

  const raw = metadata as Record<string, unknown>

  return {
    features: Array.isArray(raw.features)
      ? raw.features.filter((item): item is string => typeof item === "string")
      : [],
    highlights: Array.isArray(raw.highlights)
      ? raw.highlights.filter(
          (item): item is { label: string; value: string } =>
            !!item &&
            typeof item === "object" &&
            typeof (item as { label?: unknown }).label === "string" &&
            typeof (item as { value?: unknown }).value === "string"
        )
      : [],
    idealFor: Array.isArray(raw.idealFor)
      ? raw.idealFor.filter((item): item is string => typeof item === "string")
      : [],
    operations: Array.isArray(raw.operations)
      ? raw.operations.filter((item): item is string => typeof item === "string")
      : [],
  }
}

function mapDbProduct(record: ProductCommerceRecord): ProductCommerceContext {
  const metadata = parseProductMetadata(record.metadata)
  const inventory = record.inventoryBalances[0]

  return {
    source: "database",
    product: {
      slug: record.slug,
      name: record.name,
      tagline: record.tagline ?? "",
      description: record.description ?? "",
      price:
        record.priceLabel ??
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: record.currency,
          maximumFractionDigits: 0,
        }).format(Number(record.price)),
      priceValue: Number(record.price),
      category: record.category,
      domain: record.domain,
      icon: getCatalogIcon(record.slug),
      features: metadata.features,
      highlights: metadata.highlights,
      idealFor: metadata.idealFor,
      operations: metadata.operations,
      isFeatured: record.isFeatured,
      sortOrder: record.sortOrder,
      imageUrl: record.imageUrl,
    },
    optionGroups: record.optionGroups.map((group) => ({
      key: group.key,
      label: group.label,
      type: group.type,
      helperText: group.helperText,
      sortOrder: group.sortOrder,
      values: group.values.map((value) => ({
        key: value.key,
        label: value.label,
        description: value.description,
        priceAdjustment: Number(value.priceAdjustment),
        badge: value.badge,
        isDefault: value.isDefault,
        sortOrder: value.sortOrder,
        metadata: value.metadata,
      })),
    })),
    denominations: record.denominations.map((denomination) => ({
      key: denomination.key,
      label: denomination.label,
      amount: Number(denomination.amount),
      note: denomination.note,
      isDefault: denomination.isDefault,
      sortOrder: denomination.sortOrder,
    })),
    inventoryNumbers: record.inventoryNumbers.map((number) => ({
      key: number.key,
      providerKey: number.providerKey,
      categoryKey: number.categoryKey,
      value: number.value,
      price: Number(number.price),
      tags: parseStringArray(number.tags),
      status: number.status,
      sortOrder: number.sortOrder,
    })),
    inventory: inventory
      ? {
          onHand: inventory.onHand,
          reserved: inventory.reserved,
          sold: inventory.sold,
          available: inventory.available,
          updatedAt: inventory.updatedAt,
        }
      : null,
  }
}

function mapChoiceOptions(
  options: ReadonlyArray<{
    id: string
    label: string
    description?: string
    priceAdjustment?: number
    badge?: string
    recommended?: boolean
  }>,
  type: ProductOptionType,
  key: string,
  label: string,
  sortOrder: number,
  helperText: string | null = null
): ProductCommerceOptionGroup {
  return {
    key,
    label,
    type,
    helperText,
    sortOrder,
    values: options.map((option, index) => ({
      key: option.id,
      label: option.label,
      description: option.description ?? null,
      priceAdjustment: option.priceAdjustment ?? 0,
      badge: option.badge ?? null,
      isDefault: Boolean(option.recommended),
      sortOrder: (index + 1) * 10,
      metadata: null,
    })),
  }
}

function getFallbackContext(slug: string): ProductCommerceContext {
  const content = catalogProductContent.find((item) => item.slug === slug)

  if (!content) {
    return {
      source: "fallback",
      product: null,
      optionGroups: [],
      denominations: [],
      inventoryNumbers: [],
      inventory: null,
    }
  }

  const experience = getProductPurchaseExperience(slug)
  const baseline = getProductOperationalBaseline(content)

  const optionGroups =
    experience?.kind === "infrastructure"
      ? [
          mapChoiceOptions(experience.cpuOptions, ProductOptionType.CHOICE, "cpu", "CPU", 10),
          mapChoiceOptions(experience.ramOptions, ProductOptionType.CHOICE, "ram", "RAM", 20),
          mapChoiceOptions(
            experience.storageOptions,
            ProductOptionType.CHOICE,
            "storage",
            "Storage",
            30
          ),
          mapChoiceOptions(
            experience.regionOptions,
            ProductOptionType.CHOICE,
            "region",
            "Region",
            40
          ),
          mapChoiceOptions(experience.osOptions, ProductOptionType.CHOICE, "os", "Operating System", 50),
          {
            key: "cycle",
            label: "Billing Cycle",
            type: ProductOptionType.BILLING_CYCLE,
            helperText: null,
            sortOrder: 60,
            values: experience.cycleOptions.map((option, index) => ({
              key: option.id,
              label: option.label,
              description:
                option.savings !== undefined
                  ? `${option.months} tháng • ${option.savings}`
                  : `${option.months} tháng`,
              priceAdjustment: 0,
              badge: option.savings ?? null,
              isDefault: Boolean(option.recommended),
              sortOrder: (index + 1) * 10,
              metadata: {
                months: option.months,
                multiplier: option.multiplier,
              },
            })),
          },
        ]
      : experience?.kind === "digital_goods"
        ? [
            mapChoiceOptions(
              experience.brandOptions,
              ProductOptionType.CHOICE,
              "brand",
              "Brand / Provider",
              10,
              experience.deliveryMessage
            ),
          ]
        : experience?.kind === "sim"
          ? [
              mapChoiceOptions(
                experience.providerOptions,
                ProductOptionType.CHOICE,
                "provider",
                "Telecom Provider",
                10
              ),
              mapChoiceOptions(
                experience.categoryOptions,
                ProductOptionType.CHOICE,
                "category",
                "Number Category",
                20
              ),
            ]
          : experience?.kind === "topup"
            ? [
                mapChoiceOptions(
                  experience.carrierOptions,
                  ProductOptionType.CHOICE,
                  "carrier",
                  "Carrier",
                  10,
                  experience.helperText
                ),
              ]
            : []

  const denominations =
    experience?.kind === "digital_goods" || experience?.kind === "topup"
      ? experience.denominationOptions.map((option, index) => ({
          key: option.id,
          label: option.label,
          amount: option.amount,
          note: option.note ?? null,
          isDefault: Boolean(option.recommended),
          sortOrder: (index + 1) * 10,
        }))
      : []

  const inventoryNumbers =
    experience?.kind === "sim"
      ? experience.availableNumbers.map((number, index) => ({
          key: number.id,
          providerKey: number.providerId,
          categoryKey: number.categoryId,
          value: number.value,
          price: number.price,
          tags: [...number.tags],
          status: InventoryNumberStatus.AVAILABLE,
          sortOrder: (index + 1) * 10,
        }))
      : []

  return {
    source: "fallback",
    product: {
      slug: content.slug,
      name: content.name,
      tagline: content.tagline,
      description: content.description,
      price: content.priceLabel,
      priceValue: content.priceValue,
      category: content.category,
      domain: content.domain,
      icon: getCatalogIcon(content.slug),
      features: content.features,
      highlights: content.highlights,
      idealFor: content.idealFor,
      operations: content.operations,
      isFeatured: content.isFeatured ?? false,
      sortOrder: content.sortOrder ?? 0,
      imageUrl: content.imageUrl ?? null,
    },
    optionGroups,
    denominations,
    inventoryNumbers,
    inventory: {
      onHand: baseline.available + baseline.reserved,
      reserved: baseline.reserved,
      sold: baseline.sold,
      available: baseline.available,
      updatedAt: null,
    },
  }
}

export const getProductCommerceContext = cache(async (slug: string) => {
  if (!slug || !process.env.DATABASE_URL) {
    return getFallbackContext(slug)
  }

  try {
    const prisma = getPrismaClient()
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
      },
      select: productCommerceSelect,
    })

    return product ? mapDbProduct(product) : getFallbackContext(slug)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load product commerce context.", error)
    }

    return getFallbackContext(slug)
  }
})
