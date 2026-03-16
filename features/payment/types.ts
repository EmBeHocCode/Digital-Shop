export const paymentMethodCodes = [
  "wallet",
  "card",
  "bank_transfer",
  "manual_confirmation",
] as const

export const topupPaymentMethodCodes = [
  "bank_transfer",
  "manual_confirmation",
] as const

export const paymentProviderCodes = [
  "internal_wallet",
  "manual_bank_transfer",
  "manual_review",
  "stripe",
  "vnpay",
] as const

export const paymentIntentStatuses = [
  "pending",
  "succeeded",
  "requires_action",
  "failed",
  "canceled",
] as const

export type PaymentMethodCode = (typeof paymentMethodCodes)[number]
export type TopupPaymentMethodCode = (typeof topupPaymentMethodCodes)[number]
export type PaymentProviderCode = (typeof paymentProviderCodes)[number]
export type PaymentIntentStatus = (typeof paymentIntentStatuses)[number]

export interface PaymentInstructionSet {
  title: string
  lines: string[]
}

export interface CheckoutPaymentOption {
  value: PaymentMethodCode
  title: string
  description: string
}

export interface TopupPaymentOption {
  value: TopupPaymentMethodCode
  title: string
  description: string
}
