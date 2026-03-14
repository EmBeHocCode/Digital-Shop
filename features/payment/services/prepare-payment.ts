import { OrderStatus, TransactionStatus } from "@prisma/client"
import type {
  PaymentInstructionSet,
  PaymentIntentStatus,
  PaymentMethodCode,
  PaymentProviderCode,
  TopupPaymentMethodCode,
} from "@/features/payment/types"
import { getPaymentInstructions } from "@/features/payment/utils"

export interface OrderPaymentPlan {
  method: PaymentMethodCode
  provider: PaymentProviderCode
  paymentStatus: PaymentIntentStatus
  orderStatus: OrderStatus
  transactionStatus: TransactionStatus
  instructions: PaymentInstructionSet
  requiresWalletBalance: boolean
}

export interface TopupPaymentPlan {
  method: TopupPaymentMethodCode
  provider: "manual_bank_transfer" | "manual_review"
  paymentStatus: PaymentIntentStatus
  transactionStatus: TransactionStatus
  instructions: PaymentInstructionSet
}

export function getOrderPaymentPlan(
  method: PaymentMethodCode,
  reference?: string | null
): OrderPaymentPlan {
  if (method === "wallet") {
    return {
      method,
      provider: "internal_wallet",
      paymentStatus: "succeeded",
      orderStatus: OrderStatus.PROCESSING,
      transactionStatus: TransactionStatus.COMPLETED,
      instructions: getPaymentInstructions(method, "internal_wallet", "succeeded", reference),
      requiresWalletBalance: true,
    }
  }

  if (method === "bank_transfer") {
    return {
      method,
      provider: "manual_bank_transfer",
      paymentStatus: "pending",
      orderStatus: OrderStatus.PENDING,
      transactionStatus: TransactionStatus.PENDING,
      instructions: getPaymentInstructions(method, "manual_bank_transfer", "pending", reference),
      requiresWalletBalance: false,
    }
  }

  return {
    method,
    provider: "manual_review",
    paymentStatus: "pending",
    orderStatus: OrderStatus.PENDING,
    transactionStatus: TransactionStatus.PENDING,
    instructions: getPaymentInstructions(method, "manual_review", "pending", reference),
    requiresWalletBalance: false,
  }
}

export function getTopupPaymentPlan(
  method: TopupPaymentMethodCode,
  reference?: string | null
): TopupPaymentPlan {
  if (method === "bank_transfer") {
    return {
      method,
      provider: "manual_bank_transfer",
      paymentStatus: "pending",
      transactionStatus: TransactionStatus.PENDING,
      instructions: getPaymentInstructions(method, "manual_bank_transfer", "pending", reference),
    }
  }

  return {
    method,
    provider: "manual_review",
    paymentStatus: "pending",
    transactionStatus: TransactionStatus.PENDING,
    instructions: getPaymentInstructions(method, "manual_review", "pending", reference),
  }
}
