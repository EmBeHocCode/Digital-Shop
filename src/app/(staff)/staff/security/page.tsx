import { PasswordChangeForm } from "@/components/forms/password-change-form";

export default function StaffSecurityRoute() {
  return (
    <PasswordChangeForm
      title="Đổi mật khẩu nhân viên"
      description="Đổi mật khẩu để đảm bảo tài khoản nhân viên luôn an toàn trong quá trình vận hành."
    />
  );
}
