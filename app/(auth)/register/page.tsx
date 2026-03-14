import type { Metadata } from "next"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { RegisterForm } from "@/features/auth/components/register-form"

interface RegisterPageProps {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export const metadata: Metadata = {
  title: "Đăng ký | NexCloud",
  description: "Tạo tài khoản NexCloud để dùng dashboard, ví và checkout trong các phase tiếp theo.",
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackUrl = resolvedSearchParams.callbackUrl || "/dashboard"

  return (
    <AuthShell
      alternateHref={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="Đăng nhập"
      alternateText="Đã có tài khoản?"
      description="Đăng ký tài khoản mới để nhận ví mặc định, lưu lịch sử giao dịch và sẵn sàng cho luồng mua hàng ở các phase kế tiếp."
      title="Tạo tài khoản để tiếp tục mua hàng"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
