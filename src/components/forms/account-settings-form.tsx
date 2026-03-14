"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { accountSettingsSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  serializeSessionUser,
  sessionUserUpdatedEventName,
  type SessionUserCookie
} from "@/services/auth-service";
import type { User } from "@/types/domain";
import type { AccountSettingsFormValues } from "@/types/forms";
import { getRoleLabel } from "@/utils/auth";

function toSessionCookieUser(user: User): SessionUserCookie {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar
  };
}

export function AccountSettingsForm({
  user,
  title = "Thông tin tài khoản",
  description = "Cập nhật hồ sơ để tên hiển thị và thông tin liên hệ luôn chính xác trên toàn hệ thống."
}: {
  user: User;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone
    }
  });

  const onSubmit = async (values: AccountSettingsFormValues) => {
    setServerMessage("");

    try {
      const response = await fetch("/api/profile/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        user?: User;
      };

      if (!response.ok || !payload.success || !payload.user) {
        setMessageTone("error");
        setServerMessage(payload.message ?? "Không thể cập nhật thông tin tài khoản.");
        return;
      }

      reset({
        fullName: payload.user.fullName,
        phone: payload.user.phone
      });

      document.cookie = `meowmarket-user=${serializeSessionUser(
        toSessionCookieUser(payload.user)
      )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      window.dispatchEvent(
        new CustomEvent(sessionUserUpdatedEventName, {
          detail: toSessionCookieUser(payload.user)
        })
      );

      setMessageTone("success");
      setServerMessage("Thông tin tài khoản đã được cập nhật.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setServerMessage("Không thể kết nối tới máy chủ cập nhật tài khoản.");
    }
  };

  return (
    <Card>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-ink">{title}</h1>
        <p className="text-sm leading-7 text-muted">{description}</p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Họ tên</label>
            <input
              {...register("fullName")}
              placeholder="Nhập họ tên"
              className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
            />
            {errors.fullName ? (
              <p className="text-sm text-rose-500">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-muted outline-none"
            />
            <p className="text-xs text-muted">Email hiện được dùng làm tài khoản đăng nhập.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Số điện thoại</label>
            <input
              {...register("phone")}
              placeholder="Nhập số điện thoại"
              className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
            />
            {errors.phone ? <p className="text-sm text-rose-500">{errors.phone.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink">Vai trò</label>
            <input
              value={getRoleLabel(user.role)}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-muted outline-none"
            />
            <p className="text-xs text-muted">
              Vai trò được quản lý trong hệ thống phân quyền và không chỉnh trực tiếp tại đây.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
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
