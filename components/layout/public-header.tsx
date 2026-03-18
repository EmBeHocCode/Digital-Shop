"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react"
import { CartLink } from "@/features/cart/components/cart-link"
import { AppLogo } from "@/components/shared/app-logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { canAccessManagementDashboard } from "@/lib/auth/role-helpers"

const navigation = [
  { name: "Sản phẩm", href: "/services" },
  { name: "Bảng giá", href: "/#pricing" },
  { name: "Tính năng", href: "/#features" },
  { name: "FAQ", href: "/#faq" },
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const canOpenProfile = isAuthenticated
  const canOpenDashboard = canAccessManagementDashboard(session?.user?.role)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/" })
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "landing-nav-shell border-b"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex lg:flex-1">
          <AppLogo href="/" />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            className="border border-border/70 bg-background/82 transition-all hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/10 dark:bg-white/[0.03]"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
            <span className="sr-only">Mở menu</span>
          </Button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              prefetch={item.href === "/services" ? false : undefined}
              className="landing-nav-link text-sm"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-x-3 lg:flex lg:flex-1 lg:justify-end">
          <ThemeToggle />
          <CartLink />
          {isAuthenticated ? (
            <>
              {canOpenProfile ? (
                <Button
                  className="border border-border/70 bg-background/82 shadow-[0_14px_36px_-28px_rgba(56,189,248,0.16)] transition-all hover:-translate-y-0.5 hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/8 dark:bg-white/[0.03] dark:shadow-[0_14px_36px_-28px_rgba(56,189,248,0.28)]"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard/profile">
                    <UserRound className="size-4" />
                    Tài khoản
                  </Link>
                </Button>
              ) : null}
              {canOpenDashboard ? (
                <Button
                  className="border border-border/70 bg-background/82 transition-all hover:-translate-y-0.5 hover:border-cyan-400/24 hover:bg-cyan-500/8 dark:border-white/8 dark:bg-white/[0.03]"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : null}
              <Button
                className="border-border/70 bg-background/90 shadow-[0_18px_38px_-30px_rgba(56,189,248,0.14)] transition-all hover:-translate-y-0.5 hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/10 dark:bg-background/72 dark:shadow-[0_18px_38px_-30px_rgba(56,189,248,0.28)]"
                onClick={handleSignOut}
                size="sm"
                variant="outline"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button
                className="border border-border/70 bg-background/82 transition-all hover:-translate-y-0.5 hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/8 dark:bg-white/[0.03]"
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button
                className="shadow-[0_18px_36px_-24px_rgba(56,189,248,0.46)] transition-all hover:-translate-y-0.5"
                size="sm"
                asChild
              >
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="landing-nav-shell fixed inset-y-0 right-0 w-full max-w-sm border-l p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <AppLogo href="/" />
              <Button
                className="border border-border/70 bg-background/82 transition-all hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/10 dark:bg-white/[0.03]"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="size-5" />
                <span className="sr-only">Đóng menu</span>
              </Button>
            </div>

            <div className="mt-8 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={item.href === "/services" ? false : undefined}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.04]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8">
              <CartLink />
              {isAuthenticated ? (
                <>
                  {canOpenProfile ? (
                    <Button
                      variant="outline"
                      className="w-full border-border/70 bg-background/82 hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/10 dark:bg-white/[0.03]"
                      asChild
                    >
                      <Link href="/dashboard/profile" onClick={() => setMobileMenuOpen(false)}>
                        <UserRound className="size-4" />
                        Tài khoản
                      </Link>
                    </Button>
                  ) : null}
                  {canOpenDashboard ? (
                    <Button
                      variant="outline"
                      className="w-full border-border/70 bg-background/82 hover:border-cyan-400/24 hover:bg-cyan-500/8 dark:border-white/10 dark:bg-white/[0.03]"
                      asChild
                    >
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    variant="ghost"
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full border-border/70 bg-background/82 hover:border-sky-400/24 hover:bg-sky-500/8 dark:border-white/10 dark:bg-white/[0.03]"
                    asChild
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button className="w-full shadow-[0_18px_36px_-24px_rgba(56,189,248,0.46)]" asChild>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Đăng ký miễn phí
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
