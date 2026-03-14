import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyPassword } from "@/lib/auth/password"
import { getPrismaClient } from "@/lib/db/prisma"
import { signInSchema } from "@/features/auth/validations"
import { verifyHumanVerification } from "@/lib/auth/human-verification"

type SessionRole = "USER" | "ADMIN"

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
        humanCheck: {
          label: "Human check",
          type: "text",
        },
        humanAnswer: {
          label: "Human answer",
          type: "text",
        },
        humanToken: {
          label: "Human token",
          type: "text",
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

        const isHumanVerified = verifyHumanVerification({
          answer: parsedCredentials.data.humanAnswer,
          confirmed: parsedCredentials.data.humanCheck,
          honeypot: parsedCredentials.data.website,
          token: parsedCredentials.data.humanToken,
        })

        if (!isHumanVerified) {
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
              passwordHash: true,
            },
          })

          if (!user || !user.isActive || !user.passwordHash) {
            return null
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
            role: user.role,
          }
        } catch (error) {
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
        token.role = (user as typeof user & { role?: SessionRole }).role ?? "USER"
        token.name = user.name ?? token.name
        token.email = user.email ?? token.email
        token.picture = user.image ?? token.picture
        token.phone = (user as typeof user & { phone?: string | null }).phone ?? token.phone ?? null
      }

      if (trigger === "update") {
        const nextSession = session as { name?: string | null; email?: string | null; phone?: string | null } | undefined

        if (typeof nextSession?.name === "string") {
          token.name = nextSession.name
        }

        if (typeof nextSession?.email === "string") {
          token.email = nextSession.email
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
        session.user.role = (token.role as SessionRole | undefined) ?? "USER"
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image
        session.user.phone = typeof token.phone === "string" || token.phone === null ? token.phone : null
      }

      return session
    },
  },
}
