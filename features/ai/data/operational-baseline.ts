import type { CatalogProductContent } from "@/features/catalog/types"

export interface ProductOperationalBaseline {
  unitCost: number
  available: number
  reserved: number
  sold: number
  unitsSold: number
  grossRevenue: number
  netRevenue: number
  grossProfit: number
  netProfit: number
  market: {
    demandScore: number
    competitionScore: number
    trendScore: number
    sentimentScore: number
  }
  forecast: {
    projectedDemand: number
    projectedRevenue: number
    projectedProfit: number
    confidence: number
  }
}

export function getProductOperationalBaseline(
  product: Pick<CatalogProductContent, "domain" | "priceValue" | "isFeatured">
): ProductOperationalBaseline {
  const costRatioByDomain = {
    INFRASTRUCTURE: 0.58,
    DIGITAL_GOODS: 0.83,
    TELECOM: 0.9,
  } as const

  const availableByDomain = {
    INFRASTRUCTURE: 999,
    DIGITAL_GOODS: 250,
    TELECOM: 120,
  } as const

  const unitsSoldByDomain = {
    INFRASTRUCTURE: 18,
    DIGITAL_GOODS: 46,
    TELECOM: 33,
  } as const

  const unitCost = Math.round(product.priceValue * costRatioByDomain[product.domain])
  const available = availableByDomain[product.domain]
  const reserved = product.isFeatured ? 6 : 3
  const sold = unitsSoldByDomain[product.domain] + (product.isFeatured ? 8 : 0)
  const unitsSold = sold
  const grossRevenue = product.priceValue * unitsSold
  const netRevenue = Math.round(grossRevenue * 0.965)
  const grossProfit = grossRevenue - unitCost * unitsSold
  const netProfit = netRevenue - unitCost * unitsSold

  return {
    unitCost,
    available,
    reserved,
    sold,
    unitsSold,
    grossRevenue,
    netRevenue,
    grossProfit,
    netProfit,
    market: {
      demandScore: product.isFeatured ? 0.84 : 0.68,
      competitionScore: product.domain === "DIGITAL_GOODS" ? 0.82 : 0.61,
      trendScore: product.domain === "TELECOM" ? 0.73 : 0.79,
      sentimentScore: 0.87,
    },
    forecast: {
      projectedDemand: Math.round(unitsSold * 1.15),
      projectedRevenue: Math.round(netRevenue * 1.12),
      projectedProfit: Math.round(netProfit * 1.1),
      confidence: product.isFeatured ? 0.78 : 0.69,
    },
  }
}
