"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ResetPasswordValues = {
  token: string;
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const [serverMessage, setServerMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "reset-token-demo"
    }
  });

  return (
    <Card className="w-full max-w-lg">
      <h1 className="text-3xl font-black text-ink">Đặt lại mật khẩu</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        Biểu mẫu này đã sẵn sàng cho luồng xác thực bằng mã đặt lại mật khẩu và kiểm tra thời hạn
        ở backend.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(values)
          });

          const payload = await response.json();
          setMessageTone(response.ok && payload.success ? "success" : "error");
          setServerMessage(
            response.ok && payload.success
              ? "Mật khẩu đã được cập nhật trong cơ sở dữ liệu."
              : payload.message ?? "Không thể đặt lại mật khẩu."
          );
        })}
      >
        <input {...register("token")} className="w-full rounded-2xl border border-border px-4 py-3 outline-none" />
        {errors.token ? <p className="text-sm text-danger">{errors.token.message}</p> : null}
        <input type="password" {...register("password")} placeholder="Mật khẩu mới" className="w-full rounded-2xl border border-border px-4 py-3 outline-none" />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
        <input type="password" {...register("confirmPassword")} placeholder="Nhập lại mật khẩu" className="w-full rounded-2xl border border-border px-4 py-3 outline-none" />
        {errors.confirmPassword ? <p className="text-sm text-danger">{errors.confirmPassword.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          Lưu mật khẩu mới
        </Button>
        {serverMessage ? (
          <p className={`text-sm ${messageTone === "error" ? "text-danger" : "text-success"}`}>
            {serverMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
