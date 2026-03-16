import type { Metadata } from "next"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu | NexCloud",
  description: "Tạo mật khẩu mới cho tài khoản NexCloud.",
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams
  const token = resolvedSearchParams.token ?? ""

  return (
    <AuthShell
      alternateHref="/forgot-password"
      alternateLabel="Yêu cầu liên kết mới"
      alternateText="Liên kết không còn hiệu lực?"
      description="Liên kết đặt lại mật khẩu này chỉ dùng một lần. Sau khi đổi mật khẩu, bạn có thể đăng nhập lại ngay."
      title="Tạo mật khẩu mới cho NexCloud"
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
