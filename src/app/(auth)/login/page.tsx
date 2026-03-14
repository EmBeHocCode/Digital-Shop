import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập | MeowMarket",
  description: "Đăng nhập vào tài khoản MeowMarket với validation."
};

export default function LoginRoute({
  searchParams
}: {
  searchParams?: {
    email?: string;
    registered?: string;
    redirect?: string;
  };
}) {
  return (
    <LoginForm
      presetEmail={searchParams?.email ?? "user@meowmarket.vn"}
      presetPassword={searchParams?.registered === "1" ? "" : "123456"}
      redirect={searchParams?.redirect}
      registered={searchParams?.registered === "1"}
    />
  );
}
