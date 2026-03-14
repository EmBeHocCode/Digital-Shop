import { Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"

export interface UserPreferenceSummary {
  preferredTheme: string | null
  locale: string | null
  currency: string
  marketingEmails: boolean
  orderEmails: boolean
  billingEmails: boolean
  metadata: Prisma.JsonValue | null
}

const userPreferenceSelect = {
  preferredTheme: true,
  locale: true,
  currency: true,
  marketingEmails: true,
  orderEmails: true,
  billingEmails: true,
  metadata: true,
} satisfies Prisma.UserPreferenceSelect

function getDefaultPreferences(): UserPreferenceSummary {
  return {
    preferredTheme: null,
    locale: "vi-VN",
    currency: "VND",
    marketingEmails: true,
    orderEmails: true,
    billingEmails: true,
    metadata: null,
  }
}

export const getUserPreferences = cache(async (userId: string) => {
  if (!userId || !process.env.DATABASE_URL) {
    return getDefaultPreferences()
  }

  try {
    const prisma = getPrismaClient()
    const preference = await prisma.userPreference.findUnique({
      where: {
        userId,
      },
      select: userPreferenceSelect,
    })

    return preference ?? getDefaultPreferences()
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load user preferences.", error)
    }

    return getDefaultPreferences()
  }
})
