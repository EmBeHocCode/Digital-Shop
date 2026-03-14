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
  description: "Đăng nhập vào NexCloud để tiếp tục mua hàng và truy cập khu vực quản lý nếu tài khoản có quyền.",
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackUrl = resolvedSearchParams.callbackUrl || "/"
  const challenge = createHumanVerificationChallenge()

  return (
    <AuthShell
      alternateHref={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="Tạo tài khoản"
      alternateText="Bạn chưa có tài khoản?"
      description="Đăng nhập để tiếp tục trên trang chủ, theo dõi luồng mua hàng, và mở dashboard nếu tài khoản có quyền quản lý."
      title="Đăng nhập vào NexCloud"
    >
      <LoginForm callbackUrl={callbackUrl} challenge={challenge} />
    </AuthShell>
  )
}
