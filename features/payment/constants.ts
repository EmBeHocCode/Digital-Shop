import { CreditCard, Info, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type {
  CheckoutPaymentOption,
  PaymentMethodCode,
  PaymentProviderCode,
  PaymentIntentStatus,
  TopupPaymentOption,
} from "@/features/payment/types"

export const checkoutPaymentOptions: Array<
  CheckoutPaymentOption & { icon: LucideIcon }
> = [
  {
    value: "wallet",
    title: "Ví NexCloud",
    description: "Thanh toán ngay bằng số dư ví nếu tài khoản của bạn đã có tiền.",
    icon: Wallet,
  },
  {
    value: "bank_transfer",
    title: "Chuyển khoản",
    description: "Tạo đơn trước, sau đó hoàn tất thanh toán qua chuyển khoản thủ công.",
    icon: CreditCard,
  },
  {
    value: "manual_confirmation",
    title: "Xác nhận thủ công",
    description: "Giữ chỗ cho các luồng payment thủ công hoặc provider sẽ nối ở phase sau.",
    icon: Info,
  },
]

export const topupPaymentOptions: Array<
  TopupPaymentOption & { icon: LucideIcon }
> = checkoutPaymentOptions.filter(
  (option): option is TopupPaymentOption & { icon: LucideIcon } => option.value !== "wallet"
)

export const paymentProviderLabels: Record<PaymentProviderCode, string> = {
  internal_wallet: "Ví nội bộ",
  manual_bank_transfer: "Chuyển khoản thủ công",
  manual_review: "Xác nhận thủ công",
  stripe: "Stripe",
  vnpay: "VNPay",
}

export const paymentStatusLabels: Record<PaymentIntentStatus, string> = {
  pending: "Chờ thanh toán",
  succeeded: "Đã thanh toán",
  requires_action: "Cần thao tác thêm",
  failed: "Thanh toán lỗi",
}

export const paymentMethodLabels: Record<PaymentMethodCode, string> = {
  wallet: "Ví NexCloud",
  bank_transfer: "Chuyển khoản",
  manual_confirmation: "Xác nhận thủ công",
}
