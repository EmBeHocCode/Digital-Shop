"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validators";
import type { LoginFormValues } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { serializeSessionUser } from "@/services/auth-service";
import { getDashboardHrefByRole } from "@/utils/auth";

async function getSafeJsonPayload<T>(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
}

export function LoginForm({
  presetEmail,
  presetPassword,
  redirect,
  registered
}: {
  presetEmail: string;
  presetPassword: string;
  redirect?: string;
  registered?: boolean;
}) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: presetEmail,
      password: presetPassword
    }
  });

  useEffect(() => {
    reset({
      email: presetEmail,
      password: presetPassword
    });

    if (registered) {
      setMessageTone("success");
      setServerMessage("Đăng ký thành công. Hãy đăng nhập để tiếp tục.");
      return;
    }

    setServerMessage("");
  }, [presetEmail, presetPassword, registered, reset]);

  const onSubmit = async (values: LoginFormValues) => {
    setServerMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const payload = await getSafeJsonPayload<{
        success?: boolean;
        message?: string;
        user?: {
          id: string;
          fullName: string;
          email: string;
          phone: string;
          role: "USER" | "STAFF" | "ADMIN";
          avatar: string;
        };
        session?: {
          token: string;
          role: "USER" | "STAFF" | "ADMIN";
          expiresAt: string;
        };
      }>(response);

      if (!response.ok || !payload?.success || !payload.user || !payload.session) {
        setMessageTone("error");
        setServerMessage(
          payload?.message ??
            "Không thể đăng nhập lúc này. Hãy kiểm tra cơ sở dữ liệu hoặc thử lại sau."
        );
        return;
      }

      document.cookie = `meowmarket-session=${payload.session.token}; path=/`;
      document.cookie = `meowmarket-role=${payload.user.role}; path=/`;
      document.cookie = `meowmarket-user=${serializeSessionUser(payload.user)}; path=/`;

      setMessageTone("success");
      setServerMessage("Đăng nhập thành công. Đang chuyển hướng...");
      router.push(redirect ?? getDashboardHrefByRole(payload.user.role) ?? "/profile");
      router.refresh();
    } catch {
      setMessageTone("error");
      setServerMessage("Không thể kết nối tới máy chủ đăng nhập. Hãy thử lại sau.");
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-ink">Đăng nhập MeowMarket</h1>
        <p className="text-sm leading-7 text-muted">
          Dùng email và mật khẩu để đăng nhập. Hệ thống sẽ tự nhận diện tài khoản khách hàng, nhân viên hoặc quản trị viên.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("email")}
          placeholder="Email"
          className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
        />
        {errors.email ? <p className="text-sm text-rose-500">{errors.email.message}</p> : null}
        <input
          type="password"
          {...register("password")}
          placeholder="Mật khẩu"
          className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
        />
        {errors.password ? <p className="text-sm text-rose-500">{errors.password.message}</p> : null}
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary">
            Quên mật khẩu?
          </Link>
          <Link href="/register" className="text-muted">
            Chưa có tài khoản?
          </Link>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Đăng nhập
        </Button>
        {serverMessage ? (
          <p
            className={`text-sm ${messageTone === "error" ? "text-rose-500" : "text-emerald-600"}`}
          >
            {serverMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
