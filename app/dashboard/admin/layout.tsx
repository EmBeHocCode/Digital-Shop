import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth"
import { canAccessAdmin } from "@/lib/auth/role-helpers"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard%2Fadmin")
  }

  if (!canAccessAdmin(session.user.role)) {
    redirect("/access-denied")
  }

  return children
}
