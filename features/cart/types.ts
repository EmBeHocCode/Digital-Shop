import type {
  PaymentIntentStatus,
  PaymentMethodCode,
  PaymentProviderCode,
} from "@/features/payment/types"
import type { PurchaseSelection } from "@/features/catalog/product-purchase"

export interface CartItemConfiguration {
  kind: PurchaseSelection["kind"]
  title: string
  summaryLines: string[]
  selection: PurchaseSelection
  allowQuantityAdjustment: boolean
}

export interface CartProduct {
  id: string
  slug: string
  name: string
  category: string
  priceValue: number
  priceLabel: string
  tagline: string
  configuration?: CartItemConfiguration
}

export interface CartItem extends CartProduct {
  quantity: number
}

export type CheckoutPaymentMethod = PaymentMethodCode

export interface CheckoutCustomer {
  name: string
  email: string
  phone?: string
  note?: string
}

export interface CompletedOrder {
  id: string
  reference: string
  createdAt: string
  status: string
  paymentMethod: CheckoutPaymentMethod
  paymentProvider: PaymentProviderCode
  paymentStatus: PaymentIntentStatus
  paymentInstructions: {
    title: string
    lines: string[]
  }
  customer: CheckoutCustomer
  items: CartItem[]
  currency: string
  subtotal: number
  total: number
}
