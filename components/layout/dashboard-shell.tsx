"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getDashboardPageMeta } from "@/features/dashboard/data/dashboard-data"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const currentPage = getDashboardPageMeta(pathname)

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader currentPage={currentPage.title} />
        <main className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{currentPage.heading}</h1>
              <p className="text-muted-foreground">{currentPage.description}</p>
            </div>
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
