import { LockKeyhole, MailCheck, Settings2, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { SettingsForm } from "@/features/account/components/settings-form"
import { getUserSettings } from "@/features/account/services/get-user-settings"

export default async function DashboardSettingsPage() {
  const session = await getAuthSession()
  const profile = await getUserSettings(session?.user?.id ?? "")

  if (!profile) {
    return (
      <Card className="border-border/80 bg-card/95">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Không thể tải thông tin tài khoản hiện tại.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <SettingsForm profile={profile} />

      <div className="grid gap-6">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-foreground" />
              Security posture
            </CardTitle>
            <CardDescription>
              Các trạng thái nền cho xác minh tài khoản và khả năng mở rộng auth trong phase kế tiếp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Email verification</p>
                <Badge variant="outline">
                  {profile.emailVerifiedAt ? "Verified" : "Pending"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.emailVerifiedAt
                  ? `Đã xác minh vào ${formatDateTime(profile.emailVerifiedAt)}.`
                  : "Chưa có flow xác minh email tự động ở phase hiện tại."}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <LockKeyhole className="size-4" />
                Password & session management
              </div>
              <p className="mt-2">
                Auth foundation đã sẵn sàng. Đổi mật khẩu, trusted devices và MFA sẽ là phần mở rộng hợp lý tiếp theo.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-4 text-foreground" />
              Preferences
            </CardTitle>
            <CardDescription>
              Placeholder UI cho các tuỳ chọn dashboard và billing communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">Thông báo đơn hàng</p>
              <p className="mt-2">Ưu tiên giữ active cho user đang mua hạ tầng, digital goods hoặc telecom nhiều lần.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">Billing alerts</p>
              <p className="mt-2">Phù hợp khi ví, top-up hoặc thanh toán manual confirmation cần follow-up nhanh.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck className="size-4 text-foreground" />
              Account summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>- Vai trò hiện tại: <span className="font-medium text-foreground">{profile.role}</span></p>
            <p>- Tài khoản: <span className="font-medium text-foreground">{profile.isActive ? "Đang hoạt động" : "Đã khóa"}</span></p>
            <p>- Tham gia từ: <span className="font-medium text-foreground">{formatDateTime(profile.joinedAt, { dateStyle: "medium" })}</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
