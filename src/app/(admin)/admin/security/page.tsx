import { PasswordChangeForm } from "@/components/forms/password-change-form";

export default function AdminSecurityRoute() {
  return (
    <PasswordChangeForm
      title="Đổi mật khẩu quản trị"
      description="Giữ an toàn cho tài khoản admin bằng mật khẩu mới mạnh hơn và khác với mật khẩu cũ."
    />
  );
}
