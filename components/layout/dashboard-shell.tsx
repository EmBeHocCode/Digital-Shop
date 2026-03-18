"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PremiumCard } from "@/features/dashboard/components/premium-card"
import { SectionHeader } from "@/features/dashboard/components/section-header"
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
      <SidebarInset className="min-w-0">
        <DashboardHeader currentPage={currentPage.title} />
        <main className="dashboard-page-shell min-w-0 flex-1 overflow-auto">
          <div className="mx-auto flex min-w-0 max-w-[1600px] flex-col gap-6 p-4 md:p-6">
            <PremiumCard className="overflow-hidden px-5 py-5 md:px-6 md:py-6" variant="hero">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-sky-500/10 via-cyan-400/6 to-violet-500/8" />
              <SectionHeader
                description={currentPage.description}
                eyebrow={currentPage.title}
                title={currentPage.heading}
                titleClassName="text-3xl sm:text-4xl"
              />
            </PremiumCard>
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
