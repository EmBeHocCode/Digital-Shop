"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ForgotPasswordValues = {
  email: string;
};

export function ForgotPasswordPage() {
  const [serverMessage, setServerMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  return (
    <Card className="w-full max-w-lg">
      <h1 className="text-3xl font-black text-ink">Quên mật khẩu</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        Nhập email để nhận liên kết đặt lại mật khẩu. Kiến trúc đã sẵn cho thời hạn mã đặt lại và
        dịch vụ gửi email thật.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(values)
          });

          const payload = await response.json();
          setServerMessage(payload.message ?? "Đã gửi yêu cầu đặt lại mật khẩu.");
          setResetToken(payload.token ?? "");
        })}
      >
        <input
          {...register("email")}
          placeholder="Nhập email tài khoản"
          className="w-full rounded-2xl border border-border px-4 py-3 outline-none"
        />
        {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          Gửi liên kết
        </Button>
        {serverMessage ? <p className="text-sm text-success">{serverMessage}</p> : null}
        {resetToken ? (
          <p className="text-xs text-muted">Mã đặt lại dành cho môi trường cục bộ: {resetToken}</p>
        ) : null}
      </form>
    </Card>
  );
}
