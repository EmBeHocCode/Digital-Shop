import type { Metadata } from "next"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { VerifyEmailStatus } from "@/features/auth/components/verify-email-status"

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export const metadata: Metadata = {
  title: "Xác minh email | NexCloud",
  description: "Xác minh email để kích hoạt đầy đủ tài khoản NexCloud.",
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams
  const token = resolvedSearchParams.token ?? ""

  return (
    <AuthShell
      alternateHref="/verify-email/pending"
      alternateLabel="Gửi lại email"
      alternateText="Chưa nhận được email xác minh?"
      description="Xác minh email giúp bảo vệ tài khoản, kích hoạt luồng đăng nhập chuẩn và đảm bảo thông báo billing/order được gửi đúng người."
      title="Kích hoạt email tài khoản"
    >
      <VerifyEmailStatus token={token} />
    </AuthShell>
  )
}
