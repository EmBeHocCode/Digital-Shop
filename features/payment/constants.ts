import { CreditCard, Info, Landmark, QrCode, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type {
  CheckoutPaymentOption,
  PaymentMethodCode,
  PaymentProviderCode,
  PaymentIntentStatus,
  TopupChannelOption,
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
  ...(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? [
        {
          value: "card",
          title: "Thẻ quốc tế",
          description: "Thanh toán trực tiếp qua Stripe Checkout và đối soát kết quả qua webhook.",
          icon: CreditCard,
        } satisfies CheckoutPaymentOption & { icon: LucideIcon },
      ]
    : []),
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
  (option): option is TopupPaymentOption & { icon: LucideIcon } =>
    option.value !== "wallet" && option.value !== "card"
)

export const topupChannelOptions: Array<
  TopupChannelOption & { icon: LucideIcon }
> = [
  {
    value: "manual_bank_transfer",
    title: "Chuyển khoản thường",
    description: "Tạo yêu cầu nạp rồi đối soát thủ công theo mã tham chiếu.",
    icon: Landmark,
  },
  {
    value: "sepay_qr",
    title: "SePay QR",
    description: "Tạo sẵn channel để sau này nối QR và webhook SePay mà không đổi UX nạp số dư.",
    badge: "Foundation",
    icon: QrCode,
  },
]

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
  canceled: "Đã huỷ thanh toán",
}

export const paymentMethodLabels: Record<PaymentMethodCode, string> = {
  wallet: "Ví NexCloud",
  card: "Thẻ quốc tế",
  bank_transfer: "Chuyển khoản",
  manual_confirmation: "Xác nhận thủ công",
}
