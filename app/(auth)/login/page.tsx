import type { Metadata } from "next"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/login-form"
import { createHumanVerificationChallenge } from "@/lib/auth/human-verification"

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export const metadata: Metadata = {
  title: "Đăng nhập | NexCloud",
  description: "Đăng nhập vào NexCloud để truy cập dashboard, lịch sử đơn hàng và ví.",
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackUrl = resolvedSearchParams.callbackUrl || "/dashboard"
  const challenge = createHumanVerificationChallenge()

  return (
    <AuthShell
      alternateHref={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="Tạo tài khoản"
      alternateText="Bạn chưa có tài khoản?"
      description="Đăng nhập để theo dõi đơn hàng, ví và dashboard. Luồng này giữ nguyên design language hiện tại nhưng đã nối vào Auth.js thật."
      title="Đăng nhập vào NexCloud"
    >
      <LoginForm callbackUrl={callbackUrl} challenge={challenge} />
    </AuthShell>
  )
}
