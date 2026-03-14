"use client"

import type { ComponentProps } from "react"
import { ShoppingCart } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CartProduct } from "@/features/cart/types"
import { useCartStore } from "@/store/use-cart-store"

interface AddToCartButtonProps {
  product: CartProduct
  label?: string
  className?: string
  showIcon?: boolean
  size?: ComponentProps<typeof Button>["size"]
  variant?: ComponentProps<typeof Button>["variant"]
}

export function AddToCartButton({
  product,
  label = "Thêm vào giỏ",
  className,
  showIcon = true,
  size = "default",
  variant = "default",
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const isDefaultVariant = !variant || variant === "default"

  const handleAddToCart = () => {
    addItem(product)
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} đã sẵn sàng cho bước checkout.`,
    })
  }

  return (
    <Button
      aria-label={`Thêm ${product.name} vào giỏ hàng`}
      className={cn(
        isDefaultVariant
          ? "bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          : "",
        className
      )}
      onClick={handleAddToCart}
      size={size}
      type="button"
      variant={variant}
    >
      {showIcon ? <ShoppingCart className="size-4" /> : null}
      {label}
    </Button>
  )
}
