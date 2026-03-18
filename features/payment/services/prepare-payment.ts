import { OrderStatus, TransactionStatus } from "@prisma/client"
import type {
  PaymentInstructionSet,
  PaymentIntentStatus,
  PaymentMethodCode,
  PaymentProviderCode,
  TopupChannelCode,
  TopupPaymentMethodCode,
} from "@/features/payment/types"
import { getPaymentInstructions } from "@/features/payment/utils"
import { getTopupChannelInstructions } from "@/features/payment/services/sepay-topup"

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
  channel: TopupChannelCode
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

  if (method === "card") {
    return {
      method,
      provider: "stripe",
      paymentStatus: "requires_action",
      orderStatus: OrderStatus.PENDING,
      transactionStatus: TransactionStatus.PENDING,
      instructions: getPaymentInstructions(method, "stripe", "requires_action", reference),
      requiresWalletBalance: false,
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
  reference?: string | null,
  channel: TopupChannelCode = "manual_bank_transfer"
): TopupPaymentPlan {
  if (method === "bank_transfer") {
    return {
      method,
      channel,
      provider: "manual_bank_transfer",
      paymentStatus: "pending",
      transactionStatus: TransactionStatus.PENDING,
      instructions: getTopupChannelInstructions(channel, reference),
    }
  }

  return {
    method,
    channel: "manual_bank_transfer",
    provider: "manual_review",
    paymentStatus: "pending",
    transactionStatus: TransactionStatus.PENDING,
    instructions: getPaymentInstructions(method, "manual_review", "pending", reference),
  }
}
