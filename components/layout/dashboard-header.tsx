"use client"

import { ArrowLeft, Bell, Search } from "lucide-react"
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

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        {session?.user?.email ? (
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{session.user.name || "Tài khoản"}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        ) : null}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-64 pl-8" />
        </div>
        <Button variant="ghost" size="icon" className="size-9" asChild>
          <Link href="/" aria-label="Back to landing page">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" className="size-9">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          className="hidden md:inline-flex"
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
