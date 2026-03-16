import { Prisma, type ProductDomain, type ProductStatus } from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface AdminProductFilters {
  search?: string
  domain?: ProductDomain | "ALL"
  status?: ProductStatus | "ALL"
  page?: number
  pageSize?: number
}

export interface AdminProductRow {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  category: string
  domain: string
  status: string
  isFeatured: boolean
  imageUrl: string | null
  price: number
  priceLabel: string
  sortOrder: number
  optionGroupCount: number
  denominationCount: number
  inventoryCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AdminProductsResult {
  items: AdminProductRow[]
  totalCount: number
  page: number
  pageSize: number
  summary: {
    total: number
    active: number
    draft: number
    archived: number
    featured: number
  }
}

function buildProductWhere(filters: AdminProductFilters): Prisma.ProductWhereInput {
  return {
    ...(filters.search?.trim()
      ? {
          OR: [
            { name: { contains: filters.search.trim(), mode: "insensitive" } },
            { slug: { contains: filters.search.trim(), mode: "insensitive" } },
            { category: { contains: filters.search.trim(), mode: "insensitive" } },
            { tagline: { contains: filters.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.domain && filters.domain !== "ALL" ? { domain: filters.domain } : {}),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
  }
}

export async function getAdminProducts(
  filters: AdminProductFilters = {}
): Promise<AdminProductsResult> {
  const prisma = getPrismaClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20))
  const where = buildProductWhere(filters)

  const [items, totalCount, active, draft, archived, featured] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        category: true,
        domain: true,
        status: true,
        isFeatured: true,
        price: true,
        priceLabel: true,
        currency: true,
        imageUrl: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            optionGroups: true,
            denominations: true,
            inventoryNumbers: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.product.count({ where: { ...where, status: "DRAFT" } }),
    prisma.product.count({ where: { ...where, status: "ARCHIVED" } }),
    prisma.product.count({ where: { ...where, isFeatured: true } }),
  ])

  return {
    items: items.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      category: product.category,
      domain: product.domain,
      status: product.status,
      isFeatured: product.isFeatured,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      priceLabel:
        product.priceLabel ||
        formatCurrency(Number(product.price), product.currency),
      sortOrder: product.sortOrder,
      optionGroupCount: product._count.optionGroups,
      denominationCount: product._count.denominations,
      inventoryCount: product._count.inventoryNumbers,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })),
    totalCount,
    page,
    pageSize,
    summary: {
      total: totalCount,
      active,
      draft,
      archived,
      featured,
    },
  }
}
