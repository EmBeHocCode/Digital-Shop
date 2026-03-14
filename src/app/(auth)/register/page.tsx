import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Đăng ký | MeowMarket",
  description: "Tạo tài khoản mới với form validation."
};

export default function RegisterRoute() {
  return <RegisterForm />;
}
