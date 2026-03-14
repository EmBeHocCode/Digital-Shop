import { DefaultSession } from "next-auth"

type SessionRole = "USER" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: SessionRole
      phone?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: SessionRole
    phone?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: SessionRole
    phone?: string | null
  }
}
