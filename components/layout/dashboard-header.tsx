"use client"

import { Bell, Home, Search } from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/shared/theme-toggle"

interface DashboardHeaderProps {
  currentPage?: string
}

export function DashboardHeader({ currentPage = "Overview" }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const isCustomerWorkspace = session?.user?.role === "CUSTOMER"
  const rootLabel = isCustomerWorkspace ? "Tài khoản" : "Dashboard"
  const rootHref = isCustomerWorkspace ? "/dashboard/profile" : "/dashboard"

  return (
    <header className="dashboard-topbar sticky top-0 z-20 flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b border-white/6 px-3 py-2 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href={rootHref}>{rootLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {session?.user?.email ? (
          <div className="premium-chip hidden px-3 py-2 text-right lg:block">
            <p className="text-sm font-medium">{session.user.name || "Tài khoản"}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        ) : null}
        <div className="relative hidden xl:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="premium-field w-44 pl-8 2xl:w-64" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 border border-sky-500/14 bg-sky-500/6 text-sky-200 transition-all hover:-translate-y-0.5 hover:border-sky-400/28 hover:bg-sky-500/12 hover:text-sky-100"
          asChild
        >
          <Link href="/" aria-label="Về trang chủ">
            <Home className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 border border-white/8 bg-white/[0.03] transition-all hover:-translate-y-0.5 hover:border-cyan-400/22 hover:bg-cyan-500/8"
        >
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          className="hidden border-white/10 bg-background/76 shadow-[0_16px_36px_-26px_rgba(14,165,233,0.3)] transition-all hover:-translate-y-0.5 hover:border-sky-400/28 hover:bg-sky-500/8 md:inline-flex"
          onClick={() => void signOut({ callbackUrl: "/" })}
          size="sm"
          variant="outline"
        >
          Đăng xuất
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
