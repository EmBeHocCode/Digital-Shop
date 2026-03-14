import {
  resolveProductPurchase,
  type PurchaseSelection,
} from "@/features/catalog/product-purchase"
import type { CartProduct } from "@/features/cart/types"
import { createCartLineId } from "@/features/cart/utils/cart-line-id"

interface CartProductSource {
  slug: string
  name: string
  priceValue: number
  price: string
  category: string
  tagline?: string
}

export function getCartProduct(
  service: CartProductSource,
  selection?: PurchaseSelection | null
): { product: CartProduct; quantity: number } {
  const resolved = resolveProductPurchase(
    {
      slug: service.slug,
      name: service.name,
      priceValue: service.priceValue,
      priceLabel: service.price,
      category: service.category,
    },
    selection
  )

  return {
    product: {
      id: createCartLineId(service.slug, selection),
      slug: service.slug,
      name: service.name,
      category: service.category,
      priceValue: resolved.unitPrice,
      priceLabel: resolved.unitPriceLabel,
      tagline: service.tagline ?? "",
      configuration: selection
        ? {
            kind: selection.kind,
            title: resolved.title,
            summaryLines: resolved.summaryLines,
            selection,
            allowQuantityAdjustment: resolved.allowQuantityAdjustment,
          }
        : undefined,
    },
    quantity: resolved.quantity,
  }
}
