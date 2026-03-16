import type { Metadata } from "next"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Quên mật khẩu | NexCloud",
  description: "Yêu cầu liên kết đặt lại mật khẩu cho tài khoản NexCloud.",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      alternateHref="/login"
      alternateLabel="Đăng nhập"
      alternateText="Đã nhớ mật khẩu?"
      description="Nhập email đăng ký để nhận liên kết đặt lại mật khẩu. Liên kết chỉ có hiệu lực trong thời gian ngắn để đảm bảo an toàn."
      title="Khôi phục quyền truy cập tài khoản"
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
