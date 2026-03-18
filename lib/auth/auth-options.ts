import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyPassword } from "@/lib/auth/password"
import { getPrismaClient } from "@/lib/db/prisma"
import { signInSchema } from "@/features/auth/validations"

type SessionRole = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN" | "SUPERADMIN"

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
        website: {
          label: "Website",
          type: "text",
        },
      },
      async authorize(rawCredentials) {
        const parsedCredentials = signInSchema.safeParse(rawCredentials)

        if (!parsedCredentials.success) {
          return null
        }

        if (parsedCredentials.data.website?.trim()) {
          return null
        }

        try {
          const prisma = getPrismaClient()
          const user = await prisma.user.findUnique({
            where: {
              email: parsedCredentials.data.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              phone: true,
              role: true,
              isActive: true,
              emailVerified: true,
              passwordHash: true,
            },
          })

          if (!user || !user.passwordHash) {
            return null
          }

          if (!user.isActive) {
            throw new Error("ACCOUNT_INACTIVE")
          }

          const isLocalDevelopmentBypass =
            process.env.NODE_ENV === "development" &&
            (user.email.endsWith(".local") || user.email.endsWith("@nexcloud.local"))

          if (!user.emailVerified && !isLocalDevelopmentBypass) {
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          const isPasswordValid = await verifyPassword(
            parsedCredentials.data.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            phone: user.phone,
            role: user.role as SessionRole,
          }
        } catch (error) {
          const prismaError =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof (error as { code?: unknown }).code === "string"
              ? (error as { code: string }).code
              : null

          if (
            error instanceof Error &&
            (
              error.message === "EMAIL_NOT_VERIFIED" ||
              error.message === "ACCOUNT_INACTIVE" ||
              error.message === "DATABASE_UNAVAILABLE"
            )
          ) {
            throw error
          }

          if (
            prismaError === "ECONNREFUSED" ||
            prismaError === "P1001" ||
            prismaError === "ETIMEDOUT" ||
            prismaError === "ECONNRESET"
          ) {
            throw new Error("DATABASE_UNAVAILABLE")
          }

          if (process.env.NODE_ENV === "development") {
            console.error("Credentials authorization failed", error)
          }

          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as typeof user & { role?: SessionRole }).role ?? "CUSTOMER"
        token.name = user.name ?? token.name
        token.email = user.email ?? token.email
        token.picture = user.image ?? token.picture
        token.phone = (user as typeof user & { phone?: string | null }).phone ?? token.phone ?? null
      }

      if (trigger === "update") {
        const nextSession = session as {
          name?: string | null
          email?: string | null
          image?: string | null
          phone?: string | null
        } | undefined

        if (typeof nextSession?.name === "string") {
          token.name = nextSession.name
        }

        if (typeof nextSession?.email === "string") {
          token.email = nextSession.email
        }

        if (nextSession && "image" in nextSession) {
          token.picture = nextSession.image ?? null
        }

        if (nextSession && "phone" in nextSession) {
          token.phone = nextSession.phone ?? null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = (token.role as SessionRole | undefined) ?? "CUSTOMER"
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image
        session.user.phone = typeof token.phone === "string" || token.phone === null ? token.phone : null
      }

      return session
    },
  },
}
