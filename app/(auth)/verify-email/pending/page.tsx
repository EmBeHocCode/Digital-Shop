import type { Metadata } from "next"
import { MailCheck } from "lucide-react"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form"

interface VerifyEmailPendingPageProps {
  searchParams: Promise<{
    email?: string
    sent?: string
  }>
}

export const metadata: Metadata = {
  title: "Chờ xác minh email | NexCloud",
  description: "Kiểm tra email và xác minh tài khoản NexCloud.",
}

export default async function VerifyEmailPendingPage({
  searchParams,
}: VerifyEmailPendingPageProps) {
  const resolvedSearchParams = await searchParams
  const defaultEmail = resolvedSearchParams.email ?? ""
  const verificationSent = resolvedSearchParams.sent !== "0"

  return (
    <AuthShell
      alternateHref="/login"
      alternateLabel="Đăng nhập"
      alternateText="Đã xác minh xong?"
      description="Sau khi đăng ký, bạn cần mở email và bấm vào liên kết xác minh trước khi đăng nhập. Nếu chưa nhận được thư, bạn có thể gửi lại ngay tại đây."
      title="Kiểm tra hộp thư của bạn"
    >
      <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/25">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/60 text-foreground">
            <MailCheck className="size-5" />
          </div>
          <CardTitle className="text-2xl">Xác minh email để tiếp tục</CardTitle>
          <CardDescription>
            {verificationSent
              ? "Chúng tôi đã gửi liên kết xác minh tới email đăng ký của bạn."
              : "Tài khoản đã được tạo nhưng email chưa thể gửi tự động. Bạn có thể thử gửi lại ngay tại đây."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Điều cần làm tiếp theo</p>
            <p className="mt-2">
              Mở email, bấm vào liên kết xác minh và quay lại đăng nhập. Liên kết có hiệu lực trong 24 giờ.
            </p>
          </div>

          <ResendVerificationForm defaultEmail={defaultEmail} />
        </CardContent>
      </Card>
    </AuthShell>
  )
}
