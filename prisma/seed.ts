import {
  ForecastHorizon,
  InventoryNumberStatus,
  MarketingPage,
  Prisma,
  ProductOptionType,
  ProductStatus,
  type Product,
} from "@prisma/client"
import { getProductOperationalBaseline } from "../features/ai/data/operational-baseline"
import { catalogProductContent } from "../features/catalog/data/catalog-content"
import {
  getProductPurchaseExperience,
  type BillingCycleOption,
  type ChoiceOption,
  type DenominationOption,
  type ProductPurchaseExperience,
  type SimNumberOption,
} from "../features/catalog/product-purchase"
import { getPrismaClient } from "../lib/db/prisma"
import {
  marketingFaqs,
  marketingSections,
  pricingPlans,
  testimonials,
} from "./seed-data/marketing"

const prisma = getPrismaClient()

function toDecimal(value: number) {
  return new Prisma.Decimal(value)
}

function getProductMetadata(product: (typeof catalogProductContent)[number]): Prisma.InputJsonValue {
  return {
    features: product.features,
    highlights: product.highlights.map((highlight) => ({
      label: highlight.label,
      value: highlight.value,
    })),
    idealFor: product.idealFor,
    operations: product.operations,
  }
}

async function seedProducts() {
  const seededProducts: Product[] = []

  for (const [index, product] of catalogProductContent.entries()) {
    const seededProduct = await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: toDecimal(product.priceValue),
        priceLabel: product.priceLabel,
        currency: "VND",
        domain: product.domain,
        category: product.category,
        isFeatured: product.isFeatured ?? false,
        sortOrder: product.sortOrder ?? (index + 1) * 10,
        status: ProductStatus.ACTIVE,
        imageUrl: product.imageUrl ?? null,
        metadata: getProductMetadata(product),
      },
      create: {
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: toDecimal(product.priceValue),
        priceLabel: product.priceLabel,
        currency: "VND",
        domain: product.domain,
        category: product.category,
        isFeatured: product.isFeatured ?? false,
        sortOrder: product.sortOrder ?? (index + 1) * 10,
        status: ProductStatus.ACTIVE,
        imageUrl: product.imageUrl ?? null,
        metadata: getProductMetadata(product),
      },
    })

    seededProducts.push(seededProduct)
  }

  return seededProducts
}

async function seedMarketingContent() {
  await prisma.$transaction([
    prisma.marketingFaq.deleteMany({}),
    prisma.testimonial.deleteMany({}),
    prisma.marketingSection.deleteMany({}),
  ])

  await prisma.marketingSection.createMany({
    data: marketingSections.map((section) => ({
      page: section.page as MarketingPage,
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
      ctaLabel: section.ctaLabel,
      ctaHref: section.ctaHref,
      sortOrder: section.sortOrder,
    })),
  })

  await prisma.marketingFaq.createMany({
    data: marketingFaqs.map((faq) => ({
      page: faq.page as MarketingPage,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
    })),
  })

  await prisma.testimonial.createMany({
    data: testimonials.map((testimonial) => ({
      page: testimonial.page as MarketingPage,
      name: testimonial.name,
      role: testimonial.role,
      quote: testimonial.quote,
      initials: testimonial.initials,
      rating: testimonial.rating,
      sortOrder: testimonial.sortOrder,
    })),
  })

  for (const [index, plan] of pricingPlans.entries()) {
    await prisma.pricingPlan.upsert({
      where: {
        slug: plan.slug,
      },
      update: {
        page: plan.page as MarketingPage,
        name: plan.name,
        description: plan.description,
        monthlyPrice: toDecimal(plan.monthlyPrice),
        yearlyPrice: toDecimal(plan.yearlyPrice),
        specs: plan.specs,
        features: plan.features,
        ctaLabel: plan.ctaLabel,
        ctaHref: plan.ctaHref,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder ?? (index + 1) * 10,
      },
      create: {
        slug: plan.slug,
        page: plan.page as MarketingPage,
        name: plan.name,
        description: plan.description,
        monthlyPrice: toDecimal(plan.monthlyPrice),
        yearlyPrice: toDecimal(plan.yearlyPrice),
        specs: plan.specs,
        features: plan.features,
        ctaLabel: plan.ctaLabel,
        ctaHref: plan.ctaHref,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder ?? (index + 1) * 10,
      },
    })
  }
}

function buildChoiceValues(options: readonly ChoiceOption[] | readonly BillingCycleOption[]) {
  return options.map((option, index) => {
    if ("months" in option) {
      return {
        key: option.id,
        label: option.label,
        description: `${option.months} tháng${option.savings ? ` • ${option.savings}` : ""}`,
        priceAdjustment: 0,
        badge: option.savings ?? null,
        isDefault: Boolean(option.recommended),
        sortOrder: (index + 1) * 10,
        metadata: {
          months: option.months,
          multiplier: option.multiplier,
          savings: option.savings ?? null,
        } satisfies Prisma.InputJsonValue,
      }
    }

    return {
      key: option.id,
      label: option.label,
      description: option.description ?? null,
      priceAdjustment: option.priceAdjustment ?? 0,
      badge: option.badge ?? null,
      isDefault: Boolean(option.recommended),
      sortOrder: (index + 1) * 10,
      metadata: Prisma.JsonNull,
    }
  })
}

function buildDenominationValues(options: readonly DenominationOption[]) {
  return options.map((option, index) => ({
    key: option.id,
    label: option.label,
    amount: toDecimal(option.amount),
    note: option.note ?? null,
    isDefault: Boolean(option.recommended),
    sortOrder: (index + 1) * 10,
  }))
}

function buildSimInventoryValues(options: readonly SimNumberOption[]) {
  return options.map((option, index) => ({
    key: option.id,
    providerKey: option.providerId,
    categoryKey: option.categoryId,
    value: option.value,
    price: toDecimal(option.price),
    tags: option.tags,
    sortOrder: (index + 1) * 10,
  }))
}

async function seedProductOptionGroups(product: Product, experience: ProductPurchaseExperience) {
  await prisma.productOptionValue.deleteMany({
    where: {
      group: {
        productId: product.id,
      },
    },
  })
  await prisma.productOptionGroup.deleteMany({
    where: {
      productId: product.id,
    },
  })
  await prisma.productDenomination.deleteMany({
    where: {
      productId: product.id,
    },
  })
  await prisma.productInventoryNumber.deleteMany({
    where: {
      productId: product.id,
    },
  })

  const groupDefinitions: Array<{
    key: string
    label: string
    type: ProductOptionType
    helperText?: string
    values: ReturnType<typeof buildChoiceValues>
  }> = []

  switch (experience.kind) {
    case "infrastructure":
      groupDefinitions.push(
        { key: "cpu", label: "CPU", type: ProductOptionType.CHOICE, values: buildChoiceValues(experience.cpuOptions) },
        { key: "ram", label: "RAM", type: ProductOptionType.CHOICE, values: buildChoiceValues(experience.ramOptions) },
        { key: "storage", label: "Storage", type: ProductOptionType.CHOICE, values: buildChoiceValues(experience.storageOptions) },
        { key: "region", label: "Region", type: ProductOptionType.CHOICE, values: buildChoiceValues(experience.regionOptions) },
        { key: "os", label: "Operating System", type: ProductOptionType.CHOICE, values: buildChoiceValues(experience.osOptions) },
        { key: "cycle", label: "Billing Cycle", type: ProductOptionType.BILLING_CYCLE, values: buildChoiceValues(experience.cycleOptions) },
      )
      break
    case "digital_goods":
      groupDefinitions.push({
        key: "brand",
        label: "Brand / Provider",
        type: ProductOptionType.CHOICE,
        helperText: experience.deliveryMessage,
        values: buildChoiceValues(experience.brandOptions),
      })
      await prisma.productDenomination.createMany({
        data: buildDenominationValues(experience.denominationOptions).map((option) => ({
          productId: product.id,
          ...option,
        })),
      })
      break
    case "sim":
      groupDefinitions.push(
        {
          key: "provider",
          label: "Telecom Provider",
          type: ProductOptionType.CHOICE,
          values: buildChoiceValues(experience.providerOptions),
        },
        {
          key: "category",
          label: "Number Category",
          type: ProductOptionType.CHOICE,
          values: buildChoiceValues(experience.categoryOptions),
        },
      )
      await prisma.productInventoryNumber.createMany({
        data: buildSimInventoryValues(experience.availableNumbers).map((option) => ({
          productId: product.id,
          ...option,
          status: InventoryNumberStatus.AVAILABLE,
        })),
      })
      break
    case "topup":
      groupDefinitions.push({
        key: "carrier",
        label: "Carrier",
        type: ProductOptionType.CHOICE,
        helperText: experience.helperText,
        values: buildChoiceValues(experience.carrierOptions),
      })
      await prisma.productDenomination.createMany({
        data: buildDenominationValues(experience.denominationOptions).map((option) => ({
          productId: product.id,
          ...option,
        })),
      })
      break
  }

  for (const [index, group] of groupDefinitions.entries()) {
    const createdGroup = await prisma.productOptionGroup.create({
      data: {
        productId: product.id,
        key: group.key,
        label: group.label,
        type: group.type,
        helperText: group.helperText ?? null,
        sortOrder: (index + 1) * 10,
      },
      select: {
        id: true,
      },
    })

    if (group.values.length > 0) {
      await prisma.productOptionValue.createMany({
        data: group.values.map((value) => ({
          groupId: createdGroup.id,
          key: value.key,
          label: value.label,
          description: value.description,
          priceAdjustment: toDecimal(value.priceAdjustment),
          badge: value.badge,
          isDefault: value.isDefault,
          sortOrder: value.sortOrder,
          metadata: value.metadata,
        })),
      })
    }
  }
}

async function seedProductCommerceFoundation(products: Product[]) {
  for (const product of products) {
    const experience = getProductPurchaseExperience(product.slug)

    if (!experience) {
      continue
    }

    await seedProductOptionGroups(product, experience)
  }
}

async function seedAiReadiness(products: Product[]) {
  await prisma.$transaction([
    prisma.productCostSnapshot.deleteMany({}),
    prisma.productPriceSnapshot.deleteMany({}),
    prisma.productSalesMetric.deleteMany({}),
    prisma.marketTrendSnapshot.deleteMany({}),
    prisma.forecastSnapshot.deleteMany({}),
  ])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  for (const product of products) {
    const content = catalogProductContent.find((item) => item.slug === product.slug)

    if (!content) {
      continue
    }

    const operational = getProductOperationalBaseline(content)

    await prisma.inventoryBalance.upsert({
      where: {
        productId_scopeKey: {
          productId: product.id,
          scopeKey: "default",
        },
      },
      update: {
        onHand: operational.available + operational.reserved,
        reserved: operational.reserved,
        sold: operational.sold,
        available: operational.available,
        metadata: {
          seeded: true,
          reason: "AI readiness baseline",
        },
      },
      create: {
        productId: product.id,
        scopeKey: "default",
        onHand: operational.available + operational.reserved,
        reserved: operational.reserved,
        sold: operational.sold,
        available: operational.available,
        metadata: {
          seeded: true,
          reason: "AI readiness baseline",
        },
      },
    })

    await prisma.productCostSnapshot.create({
      data: {
        productId: product.id,
        unitCost: toDecimal(operational.unitCost),
        overheadCost: toDecimal(Math.round(operational.unitCost * 0.08)),
        source: "seed-baseline",
        effectiveFrom: today,
        metadata: {
          seeded: true,
          model: "baseline-cost-ratio",
        },
      },
    })

    await prisma.productPriceSnapshot.create({
      data: {
        productId: product.id,
        salePrice: toDecimal(content.priceValue),
        compareAtPrice: toDecimal(Math.round(content.priceValue * 1.08)),
        source: "catalog-price",
        effectiveFrom: today,
        metadata: {
          seeded: true,
        },
      },
    })

    await prisma.productSalesMetric.create({
      data: {
        productId: product.id,
        metricDate: today,
        ordersCount: Math.max(1, Math.round(operational.unitsSold / 2)),
        unitsSold: operational.unitsSold,
        grossRevenue: toDecimal(operational.grossRevenue),
        netRevenue: toDecimal(operational.netRevenue),
        grossProfit: toDecimal(operational.grossProfit),
        netProfit: toDecimal(operational.netProfit),
        metadata: {
          seeded: true,
          channel: "marketplace",
        },
      },
    })

    await prisma.marketTrendSnapshot.create({
      data: {
        productId: product.id,
        domain: product.domain,
        category: product.category,
        snapshotDate: today,
        demandScore: toDecimal(operational.market.demandScore),
        competitionScore: toDecimal(operational.market.competitionScore),
        trendScore: toDecimal(operational.market.trendScore),
        sentimentScore: toDecimal(operational.market.sentimentScore),
        marketPriceLow: toDecimal(Math.round(content.priceValue * 0.92)),
        marketPriceHigh: toDecimal(Math.round(content.priceValue * 1.15)),
        source: "seed-market-baseline",
        metadata: {
          seeded: true,
          notes: "Initial market signal for AI experimentation",
        },
      },
    })

    await prisma.forecastSnapshot.create({
      data: {
        productId: product.id,
        scopeKey: product.slug,
        horizon: ForecastHorizon.WEEKLY,
        forecastDate: nextWeek,
        projectedDemand: operational.forecast.projectedDemand,
        projectedRevenue: toDecimal(operational.forecast.projectedRevenue),
        projectedProfit: toDecimal(operational.forecast.projectedProfit),
        confidence: toDecimal(operational.forecast.confidence),
        modelVersion: "seed-v1",
        metadata: {
          seeded: true,
        },
      },
    })
  }
}

async function main() {
  const products = await seedProducts()
  await seedMarketingContent()
  await seedProductCommerceFoundation(products)
  await seedAiReadiness(products)

  console.log(
    `Seeded ${products.length} products, ${marketingSections.length} marketing sections, ${marketingFaqs.length} FAQs, ${testimonials.length} testimonials and ${pricingPlans.length} pricing plans.`
  )
}

main()
  .catch((error) => {
    console.error("Database seeding failed.", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
