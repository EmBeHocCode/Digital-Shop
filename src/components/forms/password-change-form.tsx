"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { passwordChangeSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PasswordChangeFormValues } from "@/types/forms";

export function PasswordChangeForm({
  title = "Đổi mật khẩu",
  description = "Cập nhật mật khẩu mới để tăng an toàn cho tài khoản và dashboard quản trị."
}: {
  title?: string;
  description?: string;
}) {
  const [serverMessage, setServerMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (values: PasswordChangeFormValues) => {
    setServerMessage("");

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        setMessageTone("error");
        setServerMessage(payload.message ?? "Không thể đổi mật khẩu.");
        return;
      }

      reset();
      setMessageTone("success");
      setServerMessage("Mật khẩu đã được cập nhật thành công.");
    } catch {
      setMessageTone("error");
      setServerMessage("Không thể kết nối tới máy chủ đổi mật khẩu.");
    }
  };

  return (
    <Card>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-ink">{title}</h1>
        <p className="text-sm leading-7 text-muted">{description}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Mật khẩu hiện tại</label>
          <input
            type="password"
            {...register("currentPassword")}
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
          />
          {errors.currentPassword ? (
            <p className="text-sm text-rose-500">{errors.currentPassword.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Mật khẩu mới</label>
            <input
              type="password"
              {...register("newPassword")}
              placeholder="Nhập mật khẩu mới"
              className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
            />
            {errors.newPassword ? (
              <p className="text-sm text-rose-500">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-rose-500">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </Button>
          {serverMessage ? (
            <p
              className={`text-sm ${messageTone === "error" ? "text-rose-500" : "text-emerald-600"}`}
            >
              {messageTone === "success" ? (
                <FontAwesomeIcon icon={faCircleCheck} className="mr-2 h-4 w-4" />
              ) : null}
              {serverMessage}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
