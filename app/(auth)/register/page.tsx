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
  description: "Tạo tài khoản NexCloud để mua hàng, checkout và dùng các khu vực dành riêng cho tài khoản có quyền phù hợp.",
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackUrl = resolvedSearchParams.callbackUrl || "/"

  return (
    <AuthShell
      alternateHref={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="Đăng nhập"
      alternateText="Đã có tài khoản?"
      description="Đăng ký tài khoản mới để nhận ví mặc định và quay về trang chủ sau khi đăng nhập. Dashboard chỉ hiển thị cho tài khoản có quyền quản lý."
      title="Tạo tài khoản để tiếp tục mua hàng"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
