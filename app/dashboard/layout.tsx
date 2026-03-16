import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAuthSession } from "@/lib/auth"
import { canAccessManagementDashboard } from "@/lib/auth/role-helpers"

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard")
  }

  const canAccessCustomerWorkspace = session.user.role === "CUSTOMER"
  const canAccessManagementWorkspace = canAccessManagementDashboard(session.user.role)

  if (!canAccessCustomerWorkspace && !canAccessManagementWorkspace) {
    redirect("/access-denied")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
