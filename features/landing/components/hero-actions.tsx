"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, LayoutDashboard, ShoppingBag } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { canAccessManagementDashboard } from "@/lib/auth/role-helpers"

export function HeroActions() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const canOpenDashboard = canAccessManagementDashboard(session?.user?.role)

  const primaryLink = canOpenDashboard
    ? {
        href: "/dashboard",
        label: "Mở dashboard",
        icon: LayoutDashboard,
      }
    : isAuthenticated
      ? {
          href: "/services",
          label: "Mua ngay",
          icon: ArrowRight,
        }
      : {
          href: "/register",
          label: "Bắt đầu ngay",
          icon: ArrowRight,
        }

  const PrimaryIcon = primaryLink.icon

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        href={primaryLink.href}
        prefetch={false}
        className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base")}
      >
        {primaryLink.label}
        <PrimaryIcon className="ml-2 size-4" />
      </Link>
      <Link
        href="/services"
        prefetch={false}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 px-8 text-base"
        )}
      >
        <ShoppingBag className="mr-2 size-4" />
        Xem dịch vụ
      </Link>
    </div>
  )
}
