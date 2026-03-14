"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCartShopping,
  faChevronDown,
  faHeadset,
  faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import { publicNavItems } from "@/config/site";
import { useCartStore } from "@/hooks/use-cart-store";
import { Logo } from "@/components/layout/logo";
import { MegaMenu } from "@/components/layout/mega-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { SearchBar } from "@/components/ui/search-bar";
import {
  getCurrentUserFromSession,
  parseSessionUser,
  sessionUserUpdatedEventName,
  type SessionUserCookie
} from "@/services/auth-service";
import type { User } from "@/types/domain";
import {
  getAccountHrefByRole,
  getDashboardHrefByRole,
  getRoleLabel,
  getSecurityHrefByRole,
  isManagementRole
} from "@/utils/auth";

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function MainHeader() {
  const closeDelay = 160;
  const router = useRouter();
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const categoryCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = (timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const closeAllMenus = useCallback(() => {
    clearCloseTimer(categoryCloseTimerRef);
    clearCloseTimer(notificationCloseTimerRef);
    clearCloseTimer(userCloseTimerRef);
    setIsCategoryMenuOpen(false);
    setIsNotificationOpen(false);
    setIsUserMenuOpen(false);
  }, []);

  const scheduleClose = (
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    onClose: () => void
  ) => {
    clearCloseTimer(timerRef);
    timerRef.current = setTimeout(onClose, closeDelay);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [closeAllMenus]);

  useEffect(() => {
    const sessionEmail = getCookieValue("meowmarket-session");
    const role = getCookieValue("meowmarket-role") as "USER" | "STAFF" | "ADMIN" | "";
    const cookieUser = parseSessionUser(getCookieValue("meowmarket-user"));
    setCurrentUser(
      cookieUser
        ? {
            id: cookieUser.email,
            fullName: cookieUser.fullName,
            email: cookieUser.email,
            phone: cookieUser.phone,
            avatar: cookieUser.avatar,
            role: cookieUser.role,
            status: "ACTIVE",
            joinedAt: new Date().toISOString()
          }
        : getCurrentUserFromSession(sessionEmail, role || undefined)
    );
  }, []);

  useEffect(() => {
    const handleSessionUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<SessionUserCookie>).detail;

      if (!detail?.email) {
        return;
      }

      setCurrentUser({
        id: detail.id ?? detail.email,
        fullName: detail.fullName,
        email: detail.email,
        phone: detail.phone,
        avatar: detail.avatar,
        role: detail.role,
        status: "ACTIVE",
        joinedAt: new Date().toISOString()
      });
    };

    window.addEventListener(sessionUserUpdatedEventName, handleSessionUserUpdated);
    return () =>
      window.removeEventListener(sessionUserUpdatedEventName, handleSessionUserUpdated);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const wrappers = [categoryMenuRef.current, notificationMenuRef.current, userMenuRef.current];

      if (wrappers.some((wrapper) => wrapper?.contains(target))) {
        return;
      }

      closeAllMenus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      clearCloseTimer(categoryCloseTimerRef);
      clearCloseTimer(notificationCloseTimerRef);
      clearCloseTimer(userCloseTimerRef);
    };
  }, [closeAllMenus]);

  const handleLogout = () => {
    const sessionToken = getCookieValue("meowmarket-session");
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionToken })
    }).catch(() => undefined);
    document.cookie = "meowmarket-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "meowmarket-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "meowmarket-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setCurrentUser(null);
    closeAllMenus();
    router.push("/login");
    router.refresh();
  };

  const userRoleLabel = currentUser ? getRoleLabel(currentUser.role) : "";
  const dashboardHref = getDashboardHrefByRole(currentUser?.role);
  const accountHref = getAccountHrefByRole(currentUser?.role);
  const securityHref = getSecurityHrefByRole(currentUser?.role);
  const showDashboardLink = isManagementRole(currentUser?.role);
  const logoHref = pathname === "/" ? "/" : "/marketplace";
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition ${
        scrolled
          ? "border-white/60 bg-background/80 shadow-card backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Logo href={logoHref} />
          <div className="order-3 lg:order-none lg:flex-1 lg:px-8">
            <SearchBar />
          </div>
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {!currentUser ? (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 lg:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 lg:inline-flex"
                >
                  Đăng ký
                </Link>
              </>
            ) : null}
            <motion.div whileHover={{ y: -2, scale: 1.03 }}>
              <Link
                href="/cart"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm"
                aria-label="Mở giỏ hàng"
              >
                <FontAwesomeIcon icon={faCartShopping} className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>
            </motion.div>
            <div
              ref={notificationMenuRef}
              className="relative"
              onMouseEnter={() => {
                clearCloseTimer(notificationCloseTimerRef);
                setIsNotificationOpen(true);
                setIsCategoryMenuOpen(false);
                setIsUserMenuOpen(false);
              }}
              onMouseLeave={() =>
                scheduleClose(notificationCloseTimerRef, () => setIsNotificationOpen(false))
              }
            >
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.03 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-sm"
                aria-expanded={isNotificationOpen}
                aria-haspopup="menu"
                onClick={() => {
                  clearCloseTimer(notificationCloseTimerRef);
                  const nextState = !isNotificationOpen;
                  setIsNotificationOpen(nextState);
                  if (nextState) {
                    setIsCategoryMenuOpen(false);
                    setIsUserMenuOpen(false);
                  }
                }}
              >
                <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
              </motion.button>
              <AnimatePresence>
                {isNotificationOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 top-full z-40 pt-3"
                  >
                    <NotificationDropdown />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            {currentUser ? (
              <div
                ref={userMenuRef}
                className="relative"
                onMouseEnter={() => {
                  clearCloseTimer(userCloseTimerRef);
                  setIsUserMenuOpen(true);
                  setIsCategoryMenuOpen(false);
                  setIsNotificationOpen(false);
                }}
                onMouseLeave={() => scheduleClose(userCloseTimerRef, () => setIsUserMenuOpen(false))}
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    clearCloseTimer(userCloseTimerRef);
                    const nextState = !isUserMenuOpen;
                    setIsUserMenuOpen(nextState);
                    if (nextState) {
                      setIsCategoryMenuOpen(false);
                      setIsNotificationOpen(false);
                    }
                  }}
                >
                  <UserAvatar
                    fullName={currentUser.fullName}
                    avatar={currentUser.avatar}
                    size={36}
                    className="bg-rose-100 text-primary shadow-none"
                    textClassName="text-sm"
                  />
                  <div className="hidden text-left text-sm lg:block">
                    <p className="font-semibold text-ink">{currentUser.fullName}</p>
                    <p className="text-muted">{userRoleLabel}</p>
                  </div>
                </motion.button>
                <AnimatePresence>
                  {isUserMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-full z-30 pt-3"
                    >
                      <div className="w-60 rounded-[24px] border border-white/80 bg-white p-3 shadow-premium">
                        {showDashboardLink && dashboardHref ? (
                          <Link
                            href={dashboardHref}
                            onClick={() => closeAllMenus()}
                            className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-rose-50"
                          >
                            Đi tới bảng điều khiển
                          </Link>
                        ) : null}
                        <Link
                          href={accountHref}
                          onClick={() => closeAllMenus()}
                          className={`${showDashboardLink ? "mt-1" : ""} block rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-rose-50`}
                        >
                          Thông tin tài khoản
                        </Link>
                        <Link
                          href={securityHref}
                          onClick={() => closeAllMenus()}
                          className="mt-1 block rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-rose-50"
                        >
                          Đổi mật khẩu
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div
            ref={categoryMenuRef}
            className="relative"
            onMouseEnter={() => {
              clearCloseTimer(categoryCloseTimerRef);
              setIsCategoryMenuOpen(true);
              setIsNotificationOpen(false);
              setIsUserMenuOpen(false);
            }}
            onMouseLeave={() => scheduleClose(categoryCloseTimerRef, () => setIsCategoryMenuOpen(false))}
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
              aria-expanded={isCategoryMenuOpen}
              aria-haspopup="menu"
              onClick={() => {
                clearCloseTimer(categoryCloseTimerRef);
                const nextState = !isCategoryMenuOpen;
                setIsCategoryMenuOpen(nextState);
                if (nextState) {
                  setIsNotificationOpen(false);
                  setIsUserMenuOpen(false);
                }
              }}
            >
              Danh mục
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`h-3 w-3 text-muted transition ${isCategoryMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {isCategoryMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-0 top-full z-30 pt-3"
                >
                  <MegaMenu />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {publicNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-ink transition hover:bg-white hover:shadow-sm"
              >
                {item.label}
                <span className="absolute inset-x-4 bottom-1 h-0.5 scale-x-0 rounded-full bg-primary transition duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
            <Link
              href="/support"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
            >
              <FontAwesomeIcon icon={faHeadset} className="mr-2 h-4 w-4 text-primary" />
              Hỗ trợ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
