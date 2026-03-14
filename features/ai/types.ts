import type { ProductDomain } from "@prisma/client"

export type IntelligenceDataSource = "database" | "fallback"

export interface ProductIntelligenceSnapshot {
  id: string
  slug: string
  name: string
  category: string
  domain: ProductDomain
  currency: string
  isFeatured: boolean
  inventory: {
    onHand: number
    reserved: number
    sold: number
    available: number
  }
  profitability: {
    salePrice: number
    unitCost: number | null
    overheadCost: number | null
    grossRevenue: number | null
    netRevenue: number | null
    grossProfit: number | null
    netProfit: number | null
    netMargin: number | null
  }
  market: {
    demandScore: number | null
    competitionScore: number | null
    trendScore: number | null
    sentimentScore: number | null
    marketPriceLow: number | null
    marketPriceHigh: number | null
  }
  forecast: {
    forecastDate: Date | null
    projectedDemand: number | null
    projectedRevenue: number | null
    projectedProfit: number | null
    confidence: number | null
  }
}

export interface BusinessIntelligenceContext {
  source: IntelligenceDataSource
  generatedAt: Date
  summary: {
    activeProducts: number
    featuredProducts: number
    totalInventoryOnHand: number
    totalInventoryAvailable: number
    totalInventoryReserved: number
    totalUnitsSold: number
    totalNetRevenue: number
    totalNetProfit: number
  }
  products: ProductIntelligenceSnapshot[]
}
