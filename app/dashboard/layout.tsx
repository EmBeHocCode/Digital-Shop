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

  return (
    <div className="min-h-screen bg-background">
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
