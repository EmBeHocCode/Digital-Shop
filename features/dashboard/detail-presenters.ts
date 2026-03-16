import type { PaymentIntentStatus } from "@/features/payment/types"
import {
  getPaymentStatusClassName,
  getPaymentStatusLabel,
} from "@/features/payment/utils"

export type DetailStatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "violet"

export interface DetailStatusPresentation {
  label: string
  tone?: DetailStatusTone
  className?: string
}

export function getOrderStatusPresentation(status: string): DetailStatusPresentation {
  switch (status) {
    case "COMPLETED":
      return { label: "Hoàn tất", tone: "success" }
    case "PROCESSING":
      return { label: "Đang xử lý", tone: "info" }
    case "PENDING":
      return { label: "Chờ xử lý", tone: "warning" }
    case "CANCELLED":
      return { label: "Đã hủy", tone: "danger" }
    case "FAILED":
      return { label: "Thất bại", tone: "danger" }
    case "REFUNDED":
      return { label: "Đã hoàn tiền", tone: "violet" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getPaymentStatusPresentation(
  status: PaymentIntentStatus
): DetailStatusPresentation {
  return {
    label: getPaymentStatusLabel(status),
    className: getPaymentStatusClassName(status),
  }
}

export function getProvisionStatusPresentation(
  status: string
): DetailStatusPresentation {
  switch (status) {
    case "ACTIVE":
      return { label: "Đang hoạt động", tone: "success" }
    case "PROVISIONING":
      return { label: "Đang khởi tạo", tone: "info" }
    case "QUEUED":
      return { label: "Đang xếp hàng", tone: "warning" }
    case "SUSPENDED":
      return { label: "Tạm ngưng", tone: "warning" }
    case "TERMINATED":
      return { label: "Đã kết thúc", tone: "danger" }
    case "FAILED":
      return { label: "Lỗi khởi tạo", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getDeliveryStatusPresentation(
  status: string
): DetailStatusPresentation {
  switch (status) {
    case "DELIVERED":
      return { label: "Đã giao", tone: "success" }
    case "PROCESSING":
      return { label: "Đang xử lý", tone: "info" }
    case "PENDING":
      return { label: "Chờ giao", tone: "warning" }
    case "FAILED":
      return { label: "Giao lỗi", tone: "danger" }
    case "REVOKED":
      return { label: "Đã thu hồi", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getUserRolePresentation(role: string): DetailStatusPresentation {
  switch (role) {
    case "SUPERADMIN":
      return { label: "Superadmin", tone: "violet" }
    case "ADMIN":
      return { label: "Admin", tone: "violet" }
    case "MANAGER":
      return { label: "Manager", tone: "info" }
    case "STAFF":
      return { label: "Staff", tone: "warning" }
    case "CUSTOMER":
      return { label: "Customer", tone: "neutral" }
    default:
      return { label: role, tone: "neutral" }
  }
}

export function getAccountStatePresentation(
  isActive: boolean
): DetailStatusPresentation {
  return isActive
    ? { label: "Đang hoạt động", tone: "success" }
    : { label: "Bị khóa", tone: "danger" }
}

export function getDomainPresentation(domain: string) {
  switch (domain) {
    case "INFRASTRUCTURE":
      return {
        label: "Hạ tầng",
        tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      }
    case "TELECOM":
      return {
        label: "Telecom",
        tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      }
    case "DIGITAL_GOODS":
    default:
      return {
        label: "Digital goods",
        tone: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      }
  }
}

export function getProductStatusPresentation(status: string): DetailStatusPresentation {
  switch (status) {
    case "ACTIVE":
      return { label: "Đang bán", tone: "success" }
    case "DRAFT":
      return { label: "Nháp", tone: "warning" }
    case "ARCHIVED":
      return { label: "Đã lưu trữ", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getWalletStatusPresentation(status: string): DetailStatusPresentation {
  switch (status) {
    case "ACTIVE":
      return { label: "Hoạt động", tone: "success" }
    case "LOCKED":
      return { label: "Đã khóa", tone: "danger" }
    case "CLOSED":
      return { label: "Đã đóng", tone: "warning" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getTransactionStatusPresentation(status: string): DetailStatusPresentation {
  switch (status) {
    case "COMPLETED":
      return { label: "Hoàn tất", tone: "success" }
    case "PENDING":
      return { label: "Chờ xử lý", tone: "warning" }
    case "FAILED":
      return { label: "Thất bại", tone: "danger" }
    case "CANCELLED":
      return { label: "Đã hủy", tone: "danger" }
    default:
      return { label: status, tone: "neutral" }
  }
}

export function getTransactionTypePresentation(type: string): DetailStatusPresentation {
  switch (type) {
    case "TOPUP":
      return { label: "Nạp ví", tone: "info" }
    case "PAYMENT":
      return { label: "Thanh toán", tone: "warning" }
    case "REFUND":
      return { label: "Hoàn tiền", tone: "violet" }
    case "ADJUSTMENT":
      return { label: "Điều chỉnh", tone: "neutral" }
    default:
      return { label: type, tone: "neutral" }
  }
}
