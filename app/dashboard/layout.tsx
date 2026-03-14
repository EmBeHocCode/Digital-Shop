import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAuthSession } from "@/lib/auth"
import { canAccessCustomerAccount } from "@/lib/auth/role-helpers"

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard")
  }

  // Only customer role can access the /dashboard/* routes
  // Management roles will have their own /dashboard/admin area in future
  if (session.user.role && session.user.role !== "CUSTOMER") {
    // Redirect management roles to access-denied for now
    // In future, redirect to /dashboard/admin
    redirect("/access-denied")
  }

  if (!canAccessCustomerAccount(session.user.role)) {
    redirect("/access-denied")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}

