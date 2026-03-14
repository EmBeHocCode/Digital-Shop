import { Prisma } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"

export interface UserSettingsProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  image: string | null
  role: string
  isActive: boolean
  emailVerifiedAt: Date | null
  joinedAt: Date
  updatedAt: Date
}

const userSettingsSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  image: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

type UserSettingsRecord = Prisma.UserGetPayload<{
  select: typeof userSettingsSelect
}>

function mapUserSettings(record: UserSettingsRecord): UserSettingsProfile {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    phone: record.phone,
    image: record.image,
    role: record.role,
    isActive: record.isActive,
    emailVerifiedAt: record.emailVerified,
    joinedAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export const getUserSettings = cache(async (userId: string) => {
  if (!userId) {
    return null as UserSettingsProfile | null
  }

  try {
    const prisma = getPrismaClient()
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: userSettingsSelect,
    })

    if (!user) {
      return null as UserSettingsProfile | null
    }

    return mapUserSettings(user)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load user settings.", error)
    }

    return null as UserSettingsProfile | null
  }
})
