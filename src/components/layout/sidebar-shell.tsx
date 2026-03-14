"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faBagShopping,
  faBell,
  faBoxOpen,
  faChartLine,
  faCreditCard,
  faDatabase,
  faFolder,
  faGear,
  faGift,
  faHeart,
  faImages,
  faLifeRing,
  faListCheck,
  faLock,
  faMagnifyingGlass,
  faReceipt,
  faRobot,
  faServer,
  faTableCellsLarge,
  faTicket,
  faUser,
  faUsers,
  faWallet
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/utils/cn";

const iconMap = {
  user: faUser,
  lock: faLock,
  receipt: faReceipt,
  wallet: faWallet,
  "bag-shopping": faBagShopping,
  bell: faBell,
  "life-ring": faLifeRing,
  heart: faHeart,
  server: faServer,
  "chart-line": faChartLine,
  "box-open": faBoxOpen,
  users: faUsers,
  ticket: faTicket,
  images: faImages,
  gear: faGear,
  grid: faTableCellsLarge,
  "credit-card": faCreditCard,
  gift: faGift,
  folder: faFolder,
  database: faDatabase,
  "magnifying-glass": faMagnifyingGlass,
  "list-check": faListCheck,
  robot: faRobot
};

export function SidebarShell({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; href: string; icon: string }>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-6 h-fit rounded-[28px] border border-white/70 bg-white p-4 shadow-card transition-all",
        collapsed ? "w-[88px]" : "w-full max-w-[280px]"
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        {!collapsed ? <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">{title}</p> : null}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-primary"
        >
          <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-primary text-white shadow-soft"
                  : "text-ink hover:bg-rose-50"
              )}
            >
              <FontAwesomeIcon
                icon={iconMap[item.icon as keyof typeof iconMap] ?? faUser}
                className="h-4 w-4"
              />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
