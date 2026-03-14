import type { Metadata } from "next";
import { ResetPasswordPage } from "@/modules/auth/reset-password-page";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu | MeowMarket",
  description: "Đặt mật khẩu mới bằng mã đặt lại."
};

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}
