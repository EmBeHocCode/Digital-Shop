"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppLogo } from "@/components/shared/app-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getNavigationForRole, dashboardPages } from "@/features/dashboard/data/dashboard-data"

export function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const userName = session?.user?.name || "NexCloud User"
  const userEmail = session?.user?.email || "account@nexcloud.vn"
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("")

  const navigationItems = getNavigationForRole(session?.user?.role)
  const rootHref = session?.user?.role === "CUSTOMER" ? dashboardPages.profile.href : "/dashboard"
  const groupOrder = ["Workspace", "Commerce", "Admin"] as const

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href={rootHref}>
                <AppLogo
                  className="w-full"
                  subtitle="Marketplace"
                  subtitleClassName="text-muted-foreground"
                  title="NexCloud"
                  titleClassName="text-sm font-semibold"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groupOrder.map((group) => {
          const items = navigationItems.filter((item) => item.group === group)

          if (items.length === 0) {
            return null
          }

          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          item.href === "/dashboard"
                            ? pathname === item.href
                            : pathname.startsWith(item.href)
                        }
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href={dashboardPages.profile.href}>
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src="/placeholder-user.jpg" alt={userName} />
                  <AvatarFallback className="rounded-lg bg-foreground/10 text-foreground">
                    {userInitials || "NU"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
