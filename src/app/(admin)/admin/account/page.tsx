import { AccountSettingsForm } from "@/components/forms/account-settings-form";
import { ProfileAvatarUploader } from "@/components/forms/profile-avatar-uploader";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";

export default async function AdminAccountRoute() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return (
      <EmptyState
        title="Không tải được tài khoản quản trị"
        description="Phiên đăng nhập hiện tại không hợp lệ. Hãy đăng nhập lại."
        ctaLabel="Đăng nhập lại"
        ctaLink="/login"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProfileAvatarUploader user={user} />
      <AccountSettingsForm
        user={user}
        title="Tài khoản quản trị"
        description="Cập nhật tên hiển thị, số điện thoại và avatar để hồ sơ quản trị đồng bộ ở dashboard, menu và nhật ký hệ thống."
      />
    </div>
  );
}
