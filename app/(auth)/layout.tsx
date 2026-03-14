import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AppLogo } from "@/components/shared/app-logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { getAuthSession } from "@/lib/auth"
import { getDefaultSignedInPath } from "@/lib/auth/role-helpers"

interface AuthLayoutProps {
  children: ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getAuthSession()

  if (session?.user?.id) {
    redirect(getDefaultSignedInPath(session.user.role))
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.04))]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <AppLogo href="/" />
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">Trang chủ</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="px-6 py-10 lg:px-8 lg:py-14">{children}</main>
    </div>
  )
}
