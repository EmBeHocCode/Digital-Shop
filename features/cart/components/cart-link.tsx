"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/use-cart-store"

export function CartLink() {
  const items = useCartStore((state) => state.items)
  const isHydrated = useCartStore((state) => state.isHydrated)
  const itemCount = isHydrated
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 0

  return (
    <Button asChild size="sm" variant="ghost">
      <Link href="/cart" className="relative inline-flex items-center gap-2">
        <ShoppingCart className="size-4" />
        <span className="hidden xl:inline">Giỏ hàng</span>
        {itemCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background dark:bg-primary dark:text-primary-foreground">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
