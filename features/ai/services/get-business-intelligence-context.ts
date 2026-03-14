import { ForecastHorizon, Prisma, ProductStatus } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { catalogProductContent } from "@/features/catalog/data/catalog-content"
import { getProductOperationalBaseline } from "@/features/ai/data/operational-baseline"
import type {
  BusinessIntelligenceContext,
  ProductIntelligenceSnapshot,
} from "@/features/ai/types"

const intelligenceSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  domain: true,
  currency: true,
  isFeatured: true,
  price: true,
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
    },
  },
  costSnapshots: {
    take: 1,
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: {
      unitCost: true,
      overheadCost: true,
    },
  },
  priceSnapshots: {
    take: 1,
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: {
      salePrice: true,
    },
  },
  salesMetrics: {
    take: 1,
    orderBy: {
      metricDate: "desc",
    },
    select: {
      unitsSold: true,
      grossRevenue: true,
      netRevenue: true,
      grossProfit: true,
      netProfit: true,
    },
  },
  marketSnapshots: {
    take: 1,
    orderBy: {
      snapshotDate: "desc",
    },
    select: {
      demandScore: true,
      competitionScore: true,
      trendScore: true,
      sentimentScore: true,
      marketPriceLow: true,
      marketPriceHigh: true,
    },
  },
  forecastSnapshots: {
    where: {
      horizon: ForecastHorizon.WEEKLY,
    },
    take: 1,
    orderBy: {
      forecastDate: "desc",
    },
    select: {
      forecastDate: true,
      projectedDemand: true,
      projectedRevenue: true,
      projectedProfit: true,
      confidence: true,
    },
  },
} satisfies Prisma.ProductSelect

type ProductIntelligenceRecord = Prisma.ProductGetPayload<{
  select: typeof intelligenceSelect
}>

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (typeof value === "number") {
    return value
  }

  return value ? Number(value) : null
}

function finalizeContext(
  source: BusinessIntelligenceContext["source"],
  products: ProductIntelligenceSnapshot[]
): BusinessIntelligenceContext {
  return {
    source,
    generatedAt: new Date(),
    summary: {
      activeProducts: products.length,
      featuredProducts: products.filter((product) => product.isFeatured).length,
      totalInventoryOnHand: products.reduce((sum, product) => sum + product.inventory.onHand, 0),
      totalInventoryAvailable: products.reduce(
        (sum, product) => sum + product.inventory.available,
        0
      ),
      totalInventoryReserved: products.reduce(
        (sum, product) => sum + product.inventory.reserved,
        0
      ),
      totalUnitsSold: products.reduce((sum, product) => sum + product.inventory.sold, 0),
      totalNetRevenue: products.reduce(
        (sum, product) => sum + (product.profitability.netRevenue ?? 0),
        0
      ),
      totalNetProfit: products.reduce(
        (sum, product) => sum + (product.profitability.netProfit ?? 0),
        0
      ),
    },
    products,
  }
}

function mapDbProduct(product: ProductIntelligenceRecord): ProductIntelligenceSnapshot {
  const inventory = product.inventoryBalances[0]
  const cost = product.costSnapshots[0]
  const price = product.priceSnapshots[0]
  const sales = product.salesMetrics[0]
  const market = product.marketSnapshots[0]
  const forecast = product.forecastSnapshots[0]
  const salePrice = toNumber(price?.salePrice) ?? Number(product.price)
  const netRevenue = toNumber(sales?.netRevenue)
  const netProfit = toNumber(sales?.netProfit)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    domain: product.domain,
    currency: product.currency,
    isFeatured: product.isFeatured,
    inventory: {
      onHand: inventory?.onHand ?? 0,
      reserved: inventory?.reserved ?? 0,
      sold: inventory?.sold ?? 0,
      available: inventory?.available ?? 0,
    },
    profitability: {
      salePrice,
      unitCost: toNumber(cost?.unitCost),
      overheadCost: toNumber(cost?.overheadCost),
      grossRevenue: toNumber(sales?.grossRevenue),
      netRevenue,
      grossProfit: toNumber(sales?.grossProfit),
      netProfit,
      netMargin:
        netRevenue && netProfit !== null && netRevenue > 0
          ? Number((netProfit / netRevenue).toFixed(4))
          : null,
    },
    market: {
      demandScore: toNumber(market?.demandScore),
      competitionScore: toNumber(market?.competitionScore),
      trendScore: toNumber(market?.trendScore),
      sentimentScore: toNumber(market?.sentimentScore),
      marketPriceLow: toNumber(market?.marketPriceLow),
      marketPriceHigh: toNumber(market?.marketPriceHigh),
    },
    forecast: {
      forecastDate: forecast?.forecastDate ?? null,
      projectedDemand: forecast?.projectedDemand ?? null,
      projectedRevenue: toNumber(forecast?.projectedRevenue),
      projectedProfit: toNumber(forecast?.projectedProfit),
      confidence: toNumber(forecast?.confidence),
    },
  }
}

function getFallbackContext(): BusinessIntelligenceContext {
  const products = catalogProductContent.map((product, index) => {
    const baseline = getProductOperationalBaseline(product)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    return {
      id: `fallback-${index + 1}`,
      slug: product.slug,
      name: product.name,
      category: product.category,
      domain: product.domain,
      currency: "VND",
      isFeatured: product.isFeatured ?? false,
      inventory: {
        onHand: baseline.available + baseline.reserved,
        reserved: baseline.reserved,
        sold: baseline.sold,
        available: baseline.available,
      },
      profitability: {
        salePrice: product.priceValue,
        unitCost: baseline.unitCost,
        overheadCost: Math.round(baseline.unitCost * 0.08),
        grossRevenue: baseline.grossRevenue,
        netRevenue: baseline.netRevenue,
        grossProfit: baseline.grossProfit,
        netProfit: baseline.netProfit,
        netMargin:
          baseline.netRevenue > 0
            ? Number((baseline.netProfit / baseline.netRevenue).toFixed(4))
            : null,
      },
      market: {
        demandScore: baseline.market.demandScore,
        competitionScore: baseline.market.competitionScore,
        trendScore: baseline.market.trendScore,
        sentimentScore: baseline.market.sentimentScore,
        marketPriceLow: Math.round(product.priceValue * 0.92),
        marketPriceHigh: Math.round(product.priceValue * 1.15),
      },
      forecast: {
        forecastDate: nextWeek,
        projectedDemand: baseline.forecast.projectedDemand,
        projectedRevenue: baseline.forecast.projectedRevenue,
        projectedProfit: baseline.forecast.projectedProfit,
        confidence: baseline.forecast.confidence,
      },
    } satisfies ProductIntelligenceSnapshot
  })

  return finalizeContext("fallback", products)
}

export const getBusinessIntelligenceContext = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return getFallbackContext()
  }

  try {
    const prisma = getPrismaClient()
    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: intelligenceSelect,
    })

    if (products.length === 0) {
      return getFallbackContext()
    }

    return finalizeContext("database", products.map(mapDbProduct))
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load business intelligence context.", error)
    }

    return getFallbackContext()
  }
})
