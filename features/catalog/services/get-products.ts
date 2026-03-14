import { Prisma, type ProductDomain, ProductStatus } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { catalogServices } from "@/features/catalog/data/catalog-data"
import type {
  CatalogProductsResult,
  CatalogService,
  CatalogProductMetadata,
} from "@/features/catalog/types"
import { catalogMetadataSchema } from "@/features/catalog/validations"
import { getCatalogIcon } from "@/features/catalog/data/catalog-data"

const productCatalogSelect = {
  id: true,
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
  status: true,
} satisfies Prisma.ProductSelect

type CatalogProductRecord = Prisma.ProductGetPayload<{
  select: typeof productCatalogSelect
}>

function getFallbackProducts(): CatalogProductsResult {
  return {
    items: [...catalogServices].sort((left, right) => left.sortOrder - right.sortOrder),
    source: "fallback",
  }
}

function isProductDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

function parseProductMetadata(metadata: Prisma.JsonValue | null): CatalogProductMetadata {
  const parsedMetadata = catalogMetadataSchema.safeParse(metadata)

  if (!parsedMetadata.success) {
    return {
      features: [],
      highlights: [],
      idealFor: [],
      operations: [],
    }
  }

  return parsedMetadata.data
}

function mapDbProductToCatalogService(product: CatalogProductRecord): CatalogService {
  const metadata = parseProductMetadata(product.metadata)

  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline ?? "",
    description: product.description ?? "",
    price:
      product.priceLabel ??
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product.currency,
        maximumFractionDigits: 0,
      }).format(Number(product.price)),
    priceValue: Number(product.price),
    category: product.category,
    domain: product.domain,
    icon: getCatalogIcon(product.slug),
    features: metadata.features,
    highlights: metadata.highlights,
    idealFor: metadata.idealFor,
    operations: metadata.operations,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    imageUrl: product.imageUrl,
  }
}

const getCatalogProductsFromDataSource = cache(
  async (): Promise<CatalogProductsResult> => {
    if (!isProductDatabaseConfigured()) {
      return getFallbackProducts()
    }

    try {
      const prisma = getPrismaClient()
      const products = await prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: productCatalogSelect,
      })

      if (products.length === 0) {
        return getFallbackProducts()
      }

      return {
        items: products.map(mapDbProductToCatalogService),
        source: "database",
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Falling back to local catalog content", error)
      }

      return getFallbackProducts()
    }
  }
)

export async function getAllProducts() {
  return getCatalogProductsFromDataSource()
}

export async function getFeaturedProducts(limit = 3) {
  const catalog = await getCatalogProductsFromDataSource()
  const featuredProducts = catalog.items.filter((product) => product.isFeatured)

  return {
    items: featuredProducts.slice(0, limit),
    source: catalog.source,
  }
}

export async function getProductBySlug(slug: string) {
  const catalog = await getCatalogProductsFromDataSource()

  return {
    item: catalog.items.find((product) => product.slug === slug) ?? null,
    source: catalog.source,
  }
}

export async function getProductsByCategory(category: string) {
  const catalog = await getCatalogProductsFromDataSource()

  return {
    items: catalog.items.filter((product) => product.category === category),
    source: catalog.source,
  }
}

export async function getProductsByDomain(domain: ProductDomain) {
  const catalog = await getCatalogProductsFromDataSource()

  return {
    items: catalog.items.filter((product) => product.domain === domain),
    source: catalog.source,
  }
}

export async function getCatalogProductPaths() {
  const catalog = await getCatalogProductsFromDataSource()

  return catalog.items.map((item) => ({
    slug: item.slug,
  }))
}
