import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/modules/auth/forgot-password-page";

export const metadata: Metadata = {
  title: "Quên mật khẩu | MeowMarket",
  description: "Yêu cầu đặt lại mật khẩu qua email."
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
