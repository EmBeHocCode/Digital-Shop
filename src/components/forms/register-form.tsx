"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validators";
import type { RegisterFormValues } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setServerMessage(payload.message ?? "Đăng ký thất bại.");
      return;
    }

    setServerMessage("Tạo tài khoản thành công. Đang chuyển hướng...");
    router.push(`/login?registered=1&email=${encodeURIComponent(payload.user.email)}`);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-lg">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-ink">Tạo tài khoản mới</h1>
        <p className="text-sm leading-7 text-muted">
          Quy trình form được typed và sẵn sàng tích hợp NextAuth hoặc JWT sau này.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("fullName")} placeholder="Họ và tên" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.fullName ? <p className="text-sm text-rose-500">{errors.fullName.message}</p> : null}
        <input {...register("email")} placeholder="Email" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.email ? <p className="text-sm text-rose-500">{errors.email.message}</p> : null}
        <input {...register("phone")} placeholder="Số điện thoại" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.phone ? <p className="text-sm text-rose-500">{errors.phone.message}</p> : null}
        <input type="password" {...register("password")} placeholder="Mật khẩu" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.password ? <p className="text-sm text-rose-500">{errors.password.message}</p> : null}
        <input type="password" {...register("confirmPassword")} placeholder="Xác nhận mật khẩu" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.confirmPassword ? <p className="text-sm text-rose-500">{errors.confirmPassword.message}</p> : null}
        <div className="text-sm">
          <Link href="/login" className="text-primary">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Đăng ký
        </Button>
        {serverMessage ? (
          <p
            className={`text-sm ${
              serverMessage.includes("thất bại") || serverMessage.includes("tồn tại")
                ? "text-rose-500"
                : "text-emerald-600"
            }`}
          >
            {serverMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
