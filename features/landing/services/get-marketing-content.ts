import { MarketingPage, Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import {
  marketingFaqs as fallbackFaqs,
  marketingSections as fallbackSections,
  pricingPlans as fallbackPricingPlans,
  testimonials as fallbackTestimonials,
} from "@/features/landing/data/marketing-content"

export type MarketingContentSource = "database" | "fallback"

export interface MarketingSectionSummary {
  key: string
  title: string
  subtitle: string | null
  body: string | null
  ctaLabel: string | null
  ctaHref: string | null
  sortOrder: number
}

export interface MarketingFaqSummary {
  question: string
  answer: string
  sortOrder: number
}

export interface MarketingTestimonialSummary {
  name: string
  role: string | null
  company: string | null
  quote: string
  initials: string | null
  rating: number
  sortOrder: number
}

export interface MarketingPricingPlanSummary {
  slug: string
  name: string
  description: string | null
  monthlyPrice: number | null
  yearlyPrice: number | null
  currency: string
  specs: string | null
  features: string[]
  ctaLabel: string | null
  ctaHref: string | null
  isFeatured: boolean
  sortOrder: number
}

export interface MarketingContentResult {
  source: MarketingContentSource
  sections: MarketingSectionSummary[]
  faqs: MarketingFaqSummary[]
  testimonials: MarketingTestimonialSummary[]
  pricingPlans: MarketingPricingPlanSummary[]
}

const marketingSectionSelect = {
  key: true,
  title: true,
  subtitle: true,
  body: true,
  ctaLabel: true,
  ctaHref: true,
  sortOrder: true,
} satisfies Prisma.MarketingSectionSelect

const marketingFaqSelect = {
  question: true,
  answer: true,
  sortOrder: true,
} satisfies Prisma.MarketingFaqSelect

const testimonialSelect = {
  name: true,
  role: true,
  company: true,
  quote: true,
  initials: true,
  rating: true,
  sortOrder: true,
} satisfies Prisma.TestimonialSelect

const pricingPlanSelect = {
  slug: true,
  name: true,
  description: true,
  monthlyPrice: true,
  yearlyPrice: true,
  currency: true,
  specs: true,
  features: true,
  ctaLabel: true,
  ctaHref: true,
  isFeatured: true,
  sortOrder: true,
} satisfies Prisma.PricingPlanSelect

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function getFallbackMarketingContent(page: MarketingPage): MarketingContentResult {
  return {
    source: "fallback",
    sections: fallbackSections
      .filter((section) => section.page === page)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((section) => ({
        key: section.key,
        title: section.title,
        subtitle: section.subtitle ?? null,
        body: section.body ?? null,
        ctaLabel: section.ctaLabel ?? null,
        ctaHref: section.ctaHref ?? null,
        sortOrder: section.sortOrder,
      })),
    faqs: fallbackFaqs
      .filter((faq) => faq.page === page)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
      })),
    testimonials: fallbackTestimonials
      .filter((testimonial) => testimonial.page === page)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((testimonial) => ({
        name: testimonial.name,
        role: testimonial.role ?? null,
        company: null,
        quote: testimonial.quote,
        initials: testimonial.initials ?? null,
        rating: testimonial.rating,
        sortOrder: testimonial.sortOrder,
      })),
    pricingPlans: fallbackPricingPlans
      .filter((plan) => plan.page === page)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        description: plan.description ?? null,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        currency: "VND",
        specs: plan.specs ?? null,
        features: [...plan.features],
        ctaLabel: plan.ctaLabel ?? null,
        ctaHref: plan.ctaHref ?? null,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
      })),
  }
}

export const getMarketingContent = cache(async (page: MarketingPage = MarketingPage.LANDING) => {
  if (!isDatabaseConfigured()) {
    return getFallbackMarketingContent(page)
  }

  try {
    const prisma = getPrismaClient()
    const [sections, faqs, testimonials, pricingPlans] = await Promise.all([
      prisma.marketingSection.findMany({
        where: {
          page,
          isPublished: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: marketingSectionSelect,
      }),
      prisma.marketingFaq.findMany({
        where: {
          page,
          isPublished: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: marketingFaqSelect,
      }),
      prisma.testimonial.findMany({
        where: {
          page,
          isPublished: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: testimonialSelect,
      }),
      prisma.pricingPlan.findMany({
        where: {
          page,
          isPublished: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: pricingPlanSelect,
      }),
    ])

    if (
      sections.length === 0 &&
      faqs.length === 0 &&
      testimonials.length === 0 &&
      pricingPlans.length === 0
    ) {
      return getFallbackMarketingContent(page)
    }

    return {
      source: "database",
      sections: sections.map((section) => ({
        key: section.key,
        title: section.title ?? "",
        subtitle: section.subtitle,
        body: section.body,
        ctaLabel: section.ctaLabel,
        ctaHref: section.ctaHref,
        sortOrder: section.sortOrder,
      })),
      faqs: faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
      })),
      testimonials: testimonials.map((testimonial) => ({
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company,
        quote: testimonial.quote,
        initials: testimonial.initials,
        rating: testimonial.rating,
        sortOrder: testimonial.sortOrder,
      })),
      pricingPlans: pricingPlans.map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice ? Number(plan.monthlyPrice) : null,
        yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : null,
        currency: plan.currency,
        specs: plan.specs,
        features: parseStringArray(plan.features),
        ctaLabel: plan.ctaLabel,
        ctaHref: plan.ctaHref,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
      })),
    } satisfies MarketingContentResult
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load marketing content from database.", error)
    }

    return getFallbackMarketingContent(page)
  }
})
