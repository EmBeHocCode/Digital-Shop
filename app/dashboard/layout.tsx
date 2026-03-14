import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAuthSession } from "@/lib/auth"

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard")
  }

  // Allow CUSTOMER and ADMIN roles to access dashboard
  // CUSTOMER: account pages
  // ADMIN: admin features like SQL manager
  const allowedRoles = ["CUSTOMER", "ADMIN"]
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/access-denied")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
