import type { PaymentInstructionSet, TopupChannelCode } from "@/features/payment/types"

interface SepayFoundationConfig {
  bankName: string
  accountNumber: string
  accountHolder: string
  transferPrefix: string
  qrNote: string
  isConfigured: boolean
}

export interface TopupChannelPreview {
  title: string
  description: string
  details: string[]
  badge?: string
}

function getSepayFoundationConfig(): SepayFoundationConfig {
  const bankName = process.env.SEPAY_BANK_NAME?.trim() || "Ngân hàng triển khai sau"
  const accountNumber = process.env.SEPAY_BANK_ACCOUNT?.trim() || "Cấu hình khi bật SePay"
  const accountHolder = process.env.SEPAY_ACCOUNT_NAME?.trim() || "NexCloud Co."
  const transferPrefix = process.env.SEPAY_TRANSFER_PREFIX?.trim() || "NC"
  const qrNote =
    process.env.SEPAY_QR_NOTE?.trim() ||
    "Chuẩn bị cho flow QR + webhook đối soát tự động qua SePay."

  return {
    bankName,
    accountNumber,
    accountHolder,
    transferPrefix,
    qrNote,
    isConfigured: Boolean(
      process.env.SEPAY_BANK_NAME &&
        process.env.SEPAY_BANK_ACCOUNT &&
        process.env.SEPAY_ACCOUNT_NAME
    ),
  }
}

function createTransferContent(reference?: string | null) {
  const config = getSepayFoundationConfig()
  return reference ? `${config.transferPrefix}-${reference}` : `${config.transferPrefix}-TOPUP`
}

export function getTopupChannelPreview(
  channel: TopupChannelCode,
  reference?: string | null
): TopupChannelPreview {
  if (channel === "sepay_qr") {
    const config = getSepayFoundationConfig()
    const transferContent = createTransferContent(reference)

    return {
      title: "SePay QR ready",
      description: config.qrNote,
      badge: config.isConfigured ? "Sẵn cấu hình" : "Chờ cấu hình",
      details: [
        `Ngân hàng: ${config.bankName}`,
        `Tài khoản: ${config.accountNumber}`,
        `Chủ tài khoản: ${config.accountHolder}`,
        `Nội dung chuyển khoản mẫu: ${transferContent}`,
      ],
    }
  }

  return {
    title: "Chuyển khoản thủ công",
    description: "Luồng hiện tại dùng để tạo yêu cầu nạp và chờ đối soát thủ công.",
    details: [
      `Nội dung chuyển khoản mẫu: ${createTransferContent(reference)}`,
      "Sau khi nhận tiền, hệ thống hoặc admin sẽ xác nhận để cộng số dư.",
    ],
  }
}

export function getTopupChannelInstructions(
  channel: TopupChannelCode,
  reference?: string | null
): PaymentInstructionSet {
  if (channel === "sepay_qr") {
    const preview = getTopupChannelPreview(channel, reference)

    return {
      title: "Chờ đối soát qua SePay QR",
      lines: [
        "Yêu cầu nạp ví đã được tạo với kênh SePay foundation.",
        ...preview.details,
        "Hiện tại callback SePay chưa bật, nên yêu cầu vẫn ở trạng thái pending để chờ đối soát.",
      ],
    }
  }

  return {
    title: "Chờ chuyển khoản",
    lines: [
      "Yêu cầu nạp ví đã được tạo ở trạng thái chờ thanh toán.",
      `Dùng mã tham chiếu ${reference ?? "topup"} khi chuyển khoản để đối soát nhanh hơn.`,
      "Sau khi thanh toán được xác nhận, số dư ví sẽ được cập nhật.",
    ],
  }
}

export function getTopupChannelLabel(channel: TopupChannelCode) {
  return channel === "sepay_qr" ? "SePay QR" : "Chuyển khoản thủ công"
}
