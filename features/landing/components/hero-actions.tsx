"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { canAccessManagementDashboard } from "@/lib/auth/role-helpers"

export function HeroActions() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const canOpenDashboard = canAccessManagementDashboard(session?.user?.role)

  const primaryLink = canOpenDashboard
    ? {
        href: "/",
        label: "Khám phá",
        icon: ArrowRight,
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
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 rounded-2xl border border-sky-400/18 bg-foreground px-8 text-base text-background shadow-[0_22px_40px_-26px_rgba(56,189,248,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/28 hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/94"
        )}
      >
        {primaryLink.label}
        <PrimaryIcon className="ml-2 size-4" />
      </Link>
      <Link
        href="/services"
        prefetch={false}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 rounded-2xl border-border/70 bg-background/82 px-8 text-base shadow-[0_18px_36px_-32px_rgba(56,189,248,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/24 hover:bg-cyan-500/8 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_18px_36px_-32px_rgba(56,189,248,0.3)]"
        )}
      >
        <ShoppingBag className="mr-2 size-4" />
        Xem dịch vụ
      </Link>
    </div>
  )
}
