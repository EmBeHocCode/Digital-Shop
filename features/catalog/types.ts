import type { ProductDomain } from "@prisma/client"
import type { LucideIcon } from "lucide-react"

export interface CatalogHighlight {
  label: string
  value: string
}

export interface CatalogProductMetadata {
  features: string[]
  highlights: CatalogHighlight[]
  idealFor: string[]
  operations: string[]
}

export interface CatalogProductContent extends CatalogProductMetadata {
  slug: string
  name: string
  tagline: string
  description: string
  priceLabel: string
  priceValue: number
  category: string
  domain: ProductDomain
  isFeatured?: boolean
  sortOrder?: number
  imageUrl?: string | null
}

export interface CatalogService extends CatalogProductMetadata {
  slug: string
  name: string
  tagline: string
  description: string
  price: string
  priceValue: number
  category: string
  domain: ProductDomain
  icon: LucideIcon
  isFeatured: boolean
  sortOrder: number
  imageUrl?: string | null
}

export type CatalogDataSource = "database" | "fallback"

export interface CatalogProductsResult {
  items: CatalogService[]
  source: CatalogDataSource
}
