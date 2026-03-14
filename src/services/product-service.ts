import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { products as catalogProducts } from "@/mock/products";
import { runSafeDbQuery } from "@/services/db-utils";
import {
  mapPrismaCategory,
  mapPrismaProduct,
  mapPrismaReview
} from "@/services/sql-mappers";
import type { PaginatedResult, Product, ProductFilters } from "@/types/domain";

export async function getCategories() {
  return runSafeDbQuery([], async () => {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isVisible: true },
      include: {
        children: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

    return categories.map(mapPrismaCategory);
  });
}

function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const { q, category, type, promotion, priceMin, priceMax, tag } = filters;

  const where: Prisma.ProductWhereInput = {
    isPublished: true
  };
  const andConditions: Prisma.ProductWhereInput[] = [];

  if (q) {
    const normalizedType = q.trim().toUpperCase();
    const typeFilter = ["VPS", "CLOUD", "GIFTCARD", "GAMECARD", "DIGITAL"].includes(normalizedType)
      ? (normalizedType as Product["type"])
      : null;

    andConditions.push({
      OR: [
      { name: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } }
      ]
    });

    if (typeFilter) {
      andConditions[andConditions.length - 1].OR?.push({ type: typeFilter });
    }
  }

  if (category) {
    andConditions.push({
      OR: [{ categoryId: category }, { category: { parentId: category } }]
    });
  }

  if (type) {
    where.type = type;
  }

  if (promotion) {
    where.isPromotion = true;
  }

  if (typeof priceMin === "number" || typeof priceMax === "number") {
    where.price = {};
    if (typeof priceMin === "number") {
      where.price.gte = priceMin;
    }
    if (typeof priceMax === "number") {
      where.price.lte = priceMax;
    }
  }

  if (tag) {
    andConditions.push({
      tags: {
        has: tag
      }
    });
  }

  if (andConditions.length) {
    where.AND = andConditions;
  }

  return where;
}

function buildProductOrderBy(
  sort: ProductFilters["sort"]
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewsCount: "desc" }];
    case "popularity":
      return [{ reviewsCount: "desc" }, { rating: "desc" }, { isHot: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { isHot: "desc" }, { createdAt: "desc" }];
  }
}

function mergeCatalogProduct(product: Product): Product {
  const catalogProduct = catalogProducts.find((entry) => entry.id === product.id || entry.slug === product.slug);
  const configurationOptions = product.configurationOptions?.length
    ? product.configurationOptions
    : catalogProduct?.configurationOptions;
  const denominationOptions = product.denominationOptions?.length
    ? product.denominationOptions
    : catalogProduct?.denominationOptions;
  const minPrice = product.minPrice ?? catalogProduct?.minPrice;
  const maxPrice = product.maxPrice ?? catalogProduct?.maxPrice;

  return {
    ...(catalogProduct ?? {}),
    ...product,
    minPrice,
    maxPrice,
    price: product.price || catalogProduct?.price || 0,
    compareAtPrice: product.compareAtPrice ?? catalogProduct?.compareAtPrice,
    deliveryNotes: product.deliveryNotes ?? catalogProduct?.deliveryNotes,
    refundNotes: product.refundNotes ?? catalogProduct?.refundNotes,
    tags: [...new Set([...(catalogProduct?.tags ?? []), ...product.tags])],
    specs: product.specs ?? catalogProduct?.specs,
    configurationOptions,
    denominationOptions
  };
}

function matchesCatalogFilters(product: Product, filters: ProductFilters) {
  const { q, category, type, promotion, priceMin, priceMax, tag } = filters;
  const query = q?.trim().toLowerCase();
  const productMinPrice = product.minPrice ?? product.price;
  const productMaxPrice = product.maxPrice ?? product.price;

  if (type && product.type !== type) {
    return false;
  }

  if (category && product.categoryId !== category) {
    return false;
  }

  if (promotion && !product.isPromotion) {
    return false;
  }

  if (typeof priceMin === "number" && productMaxPrice < priceMin) {
    return false;
  }

  if (typeof priceMax === "number" && productMinPrice > priceMax) {
    return false;
  }

  if (tag && !product.tags.includes(tag)) {
    return false;
  }

  if (query) {
    const haystack = [
      product.name,
      product.shortDescription,
      product.description,
      product.type,
      ...product.tags
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(query)) {
      return false;
    }
  }

  return true;
}

function sortProducts(products: Product[], sort: ProductFilters["sort"] = "featured") {
  const createdAtValue = (product: Product) => new Date(product.createdAt ?? 0).getTime();
  const displayMinPrice = (product: Product) => product.minPrice ?? product.price;
  const displayMaxPrice = (product: Product) => product.maxPrice ?? product.price;

  return [...products].sort((left, right) => {
    switch (sort) {
      case "price-asc":
        return displayMinPrice(left) - displayMinPrice(right);
      case "price-desc":
        return displayMaxPrice(right) - displayMaxPrice(left);
      case "rating":
        return right.rating - left.rating || right.reviewsCount - left.reviewsCount;
      case "popularity":
        return (
          right.reviewsCount - left.reviewsCount ||
          right.rating - left.rating ||
          Number(right.isHot) - Number(left.isHot)
        );
      case "newest":
        return createdAtValue(right) - createdAtValue(left);
      case "featured":
      default:
        return (
          Number(right.isFeatured) - Number(left.isFeatured) ||
          Number(right.isHot) - Number(left.isHot) ||
          createdAtValue(right) - createdAtValue(left)
        );
    }
  });
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
  const { sort = "featured", page = 1, pageSize = 8 } = filters;
  const filteredCatalogProducts = sortProducts(
    catalogProducts.filter((product) => matchesCatalogFilters(product, filters)),
    sort
  );
  const fallbackItems = filteredCatalogProducts.slice((page - 1) * pageSize, page * pageSize);

  return runSafeDbQuery(
    {
      items: fallbackItems,
      totalItems: filteredCatalogProducts.length,
      totalPages: filteredCatalogProducts.length ? Math.ceil(filteredCatalogProducts.length / pageSize) : 0,
      currentPage: page,
      pageSize
    },
    async () => {
      const where = buildProductWhere(filters);
      const records = await prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { sortOrder: "asc" }
          }
        }
      });

      const mappedRecords = records.map((record) => mergeCatalogProduct(mapPrismaProduct(record)));
      const catalogOnlyProducts = catalogProducts.filter(
        (product) =>
          !mappedRecords.some((record) => record.id === product.id) && matchesCatalogFilters(product, filters)
      );
      const mergedProducts = sortProducts([...mappedRecords, ...catalogOnlyProducts], sort);
      const totalItems = mergedProducts.length;
      const pagedProducts = mergedProducts.slice((page - 1) * pageSize, page * pageSize);

      return {
        items: pagedProducts,
        totalItems,
        totalPages: totalItems ? Math.ceil(totalItems / pageSize) : 0,
        currentPage: page,
        pageSize
      };
    }
  );
}

export async function getProductBySlug(slug: string) {
  return runSafeDbQuery<Product | undefined>(catalogProducts.find((product) => product.slug === slug), async () => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    return product ? mergeCatalogProduct(mapPrismaProduct(product)) : catalogProducts.find((entry) => entry.slug === slug);
  });
}

export async function getFeaturedProducts() {
  return runSafeDbQuery<Product[]>(catalogProducts.filter((product) => product.isFeatured).slice(0, 6), async () => {
    const records = await prisma.product.findMany({
      where: {
        isPublished: true,
        isFeatured: true
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ isHot: "desc" }, { createdAt: "desc" }]
    });

    const mergedProducts = records.map((record) => mergeCatalogProduct(mapPrismaProduct(record)));
    const catalogOnlyProducts = catalogProducts.filter(
      (product) => product.isFeatured && !mergedProducts.some((record) => record.id === product.id)
    );

    return sortProducts([...mergedProducts, ...catalogOnlyProducts], "featured").slice(0, 6);
  });
}

export async function getHotProducts() {
  return runSafeDbQuery<Product[]>(catalogProducts.filter((product) => product.isHot).slice(0, 6), async () => {
    const records = await prisma.product.findMany({
      where: {
        isPublished: true,
        isHot: true
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ reviewsCount: "desc" }, { rating: "desc" }]
    });

    const mergedProducts = records.map((record) => mergeCatalogProduct(mapPrismaProduct(record)));
    const catalogOnlyProducts = catalogProducts.filter(
      (product) => product.isHot && !mergedProducts.some((record) => record.id === product.id)
    );

    return sortProducts([...mergedProducts, ...catalogOnlyProducts], "popularity").slice(0, 6);
  });
}

export async function getPromotionProducts() {
  return runSafeDbQuery<Product[]>(catalogProducts.filter((product) => product.isPromotion).slice(0, 4), async () => {
    const records = await prisma.product.findMany({
      where: {
        isPublished: true,
        isPromotion: true
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
    });

    const mergedProducts = records.map((record) => mergeCatalogProduct(mapPrismaProduct(record)));
    const catalogOnlyProducts = catalogProducts.filter(
      (product) => product.isPromotion && !mergedProducts.some((record) => record.id === product.id)
    );

    return sortProducts([...mergedProducts, ...catalogOnlyProducts], "featured").slice(0, 4);
  });
}

export async function getRelatedProducts(productId: string) {
  return runSafeDbQuery<Product[]>([], async () => {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        type: true,
        categoryId: true,
        category: {
          select: {
            parentId: true
          }
        }
      }
    });

    if (!current) {
      const catalogCurrent = catalogProducts.find((product) => product.id === productId);
      if (!catalogCurrent) {
        return [];
      }

      return sortProducts(
        catalogProducts.filter(
          (product) =>
            product.id !== catalogCurrent.id &&
            (product.type === catalogCurrent.type || product.categoryId === catalogCurrent.categoryId)
        ),
        "featured"
      ).slice(0, 4);
    }

    const categoryIds = [current.categoryId, current.category.parentId].filter(Boolean) as string[];

    const records = await prisma.product.findMany({
      where: {
        id: { not: current.id },
        isPublished: true,
        OR: [{ type: current.type }, { categoryId: { in: categoryIds } }]
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: [{ isHot: "desc" }, { rating: "desc" }]
    });

    const mergedProducts = records.map((record) => mergeCatalogProduct(mapPrismaProduct(record)));
    const catalogOnlyProducts = catalogProducts.filter(
      (product) =>
        product.id !== current.id &&
        !mergedProducts.some((record) => record.id === product.id) &&
        (product.type === current.type || product.categoryId === current.categoryId)
    );

    return sortProducts([...mergedProducts, ...catalogOnlyProducts], "featured").slice(0, 4);
  });
}

export async function getProductReviews(productId: string) {
  return runSafeDbQuery([], async () => {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [{ verifiedPurchase: "desc" }, { createdAt: "desc" }]
    });

    return reviews.map(mapPrismaReview);
  });
}
