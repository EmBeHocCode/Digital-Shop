import {
  PaymentMethod,
  PaymentProvider,
  TransactionStatus,
} from "@prisma/client"
import {
  paymentMethodLabels,
  paymentProviderLabels,
  paymentStatusLabels,
} from "@/features/payment/constants"
import type {
  PaymentInstructionSet,
  PaymentIntentStatus,
  PaymentMethodCode,
  PaymentProviderCode,
} from "@/features/payment/types"

export function mapPaymentMethodCodeToPrisma(method: PaymentMethodCode) {
  switch (method) {
    case "wallet":
      return PaymentMethod.WALLET
    case "card":
      return PaymentMethod.CARD
    case "bank_transfer":
      return PaymentMethod.BANK_TRANSFER
    case "manual_confirmation":
      return PaymentMethod.MANUAL_CONFIRMATION
  }
}

export function mapPaymentProviderCodeToPrisma(provider: PaymentProviderCode) {
  switch (provider) {
    case "internal_wallet":
      return PaymentProvider.INTERNAL_WALLET
    case "manual_bank_transfer":
      return PaymentProvider.MANUAL_BANK_TRANSFER
    case "manual_review":
      return PaymentProvider.MANUAL_REVIEW
    case "stripe":
      return PaymentProvider.STRIPE
    case "vnpay":
      return PaymentProvider.VNPAY
  }
}

export function mapPrismaPaymentMethodToCode(
  method: PaymentMethod | null | undefined
): PaymentMethodCode | null {
  switch (method) {
    case PaymentMethod.WALLET:
      return "wallet"
    case PaymentMethod.CARD:
      return "card"
    case PaymentMethod.BANK_TRANSFER:
      return "bank_transfer"
    case PaymentMethod.MANUAL_CONFIRMATION:
      return "manual_confirmation"
    default:
      return null
  }
}

export function mapPrismaPaymentProviderToCode(
  provider: PaymentProvider | null | undefined
): PaymentProviderCode | null {
  switch (provider) {
    case PaymentProvider.INTERNAL_WALLET:
      return "internal_wallet"
    case PaymentProvider.MANUAL_BANK_TRANSFER:
      return "manual_bank_transfer"
    case PaymentProvider.MANUAL_REVIEW:
      return "manual_review"
    case PaymentProvider.STRIPE:
      return "stripe"
    case PaymentProvider.VNPAY:
      return "vnpay"
    default:
      return null
  }
}

export function mapTransactionStatusToPaymentIntentStatus(
  status: TransactionStatus
): PaymentIntentStatus {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "succeeded"
    case TransactionStatus.FAILED:
      return "failed"
    case TransactionStatus.CANCELLED:
      return "canceled"
    case TransactionStatus.PENDING:
      return "pending"
  }
}

export function getPaymentMethodLabel(method: PaymentMethodCode | null | undefined) {
  return method ? paymentMethodLabels[method] : "Chưa xác định"
}

export function getPaymentProviderLabel(provider: PaymentProviderCode | null | undefined) {
  return provider ? paymentProviderLabels[provider] : "Chưa xác định"
}

export function getPaymentStatusLabel(status: PaymentIntentStatus) {
  return paymentStatusLabels[status]
}

export function getPaymentStatusClassName(status: PaymentIntentStatus) {
  switch (status) {
    case "succeeded":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
    case "failed":
      return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
    case "canceled":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
    case "requires_action":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "pending":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  }
}

export function getPaymentInstructions(
  method: PaymentMethodCode,
  provider: PaymentProviderCode,
  status: PaymentIntentStatus,
  reference?: string | null
): PaymentInstructionSet {
  if (method === "wallet" && status === "succeeded") {
    return {
      title: "Thanh toán ví thành công",
      lines: [
        "Số dư ví đã được trừ ngay khi tạo đơn hàng.",
        "Đơn hàng đã sẵn sàng chuyển sang bước xử lý dịch vụ.",
      ],
    }
  }

  if (provider === "manual_bank_transfer") {
    return {
      title: "Chờ chuyển khoản",
      lines: [
        "Đơn hàng đã được tạo ở trạng thái chờ thanh toán.",
        `Dùng mã tham chiếu ${reference ?? "đơn hàng"} khi chuyển khoản để đối soát nhanh hơn.`,
        "Sau khi thanh toán được xác nhận, trạng thái đơn sẽ được cập nhật.",
      ],
    }
  }

  if (provider === "stripe") {
    if (status === "succeeded") {
      return {
        title: "Thanh toán Stripe thành công",
        lines: [
          "Stripe đã xác nhận thanh toán thành công cho đơn hàng này.",
          "Đơn hàng sẽ chuyển sang bước xử lý và xuất hiện trong billing history của bạn.",
        ],
      }
    }

    if (status === "canceled") {
      return {
        title: "Thanh toán đã bị huỷ",
        lines: [
          "Phiên thanh toán Stripe đã bị huỷ hoặc hết hạn trước khi hoàn tất.",
          "Bạn có thể quay lại checkout để thử lại hoặc chọn phương thức thanh toán khác.",
        ],
      }
    }

    if (status === "failed") {
      return {
        title: "Thanh toán Stripe không thành công",
        lines: [
          "Stripe chưa thể xác nhận khoản thanh toán này.",
          "Đơn hàng đã được giữ lại để bạn có thể thanh toán lại hoặc liên hệ hỗ trợ.",
        ],
      }
    }

    return {
      title: "Chờ hoàn tất thanh toán qua Stripe",
      lines: [
        "Đơn hàng đã được tạo và đang chờ bạn hoàn tất phiên thanh toán an toàn trên Stripe.",
        `Mã tham chiếu hiện tại: ${reference ?? "đơn hàng"}.`,
      ],
    }
  }

  return {
    title:
      status === "failed"
        ? "Cần xác minh lại thanh toán"
        : status === "canceled"
          ? "Thanh toán đã bị huỷ"
          : "Đơn hàng đang chờ xác nhận",
    lines: [
      "Đơn hàng đã được ghi nhận vào hệ thống.",
      "Luồng payment provider thật sẽ được nối ở phase sau trên cùng foundation này.",
      `Provider hiện tại: ${getPaymentProviderLabel(provider)}.`,
    ],
  }
}
