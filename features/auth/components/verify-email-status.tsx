"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type VerificationState = "idle" | "loading" | "verified" | "already_verified" | "expired" | "invalid"

interface VerifyEmailStatusProps {
  token: string
}

export function VerifyEmailStatus({ token }: VerifyEmailStatusProps) {
  const [state, setState] = useState<VerificationState>(token ? "loading" : "invalid")
  const [message, setMessage] = useState<string>(
    token
      ? "Đang xác minh email của bạn..."
      : "Liên kết xác minh không hợp lệ hoặc đã bị thiếu token."
  )

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
      }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { state?: VerificationState; message?: string }
          | null

        if (!isMounted) {
          return
        }

        const nextState = payload?.state ?? (response.ok ? "verified" : "invalid")
        setState(nextState)
        setMessage(
          payload?.message ??
            (nextState === "verified"
              ? "Email của bạn đã được xác minh thành công."
              : nextState === "already_verified"
                ? "Email này đã được xác minh trước đó."
                : nextState === "expired"
                  ? "Liên kết xác minh đã hết hạn."
                  : "Liên kết xác minh không hợp lệ.")
        )
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setState("invalid")
        setMessage("Không thể xác minh email lúc này. Vui lòng thử lại sau.")
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const content = useMemo(() => {
    if (state === "loading") {
      return {
        icon: <Loader2 className="size-10 animate-spin text-foreground" />,
        title: "Đang xác minh email",
        description: message,
      }
    }

    if (state === "verified" || state === "already_verified") {
      return {
        icon: <CheckCircle2 className="size-10 text-emerald-500" />,
        title: state === "verified" ? "Email đã được xác minh" : "Email đã được xác minh trước đó",
        description: message,
      }
    }

    return {
      icon: <AlertCircle className="size-10 text-rose-500" />,
      title: state === "expired" ? "Liên kết đã hết hạn" : "Không thể xác minh email",
      description: message,
    }
  }, [message, state])

  return (
    <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/25">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Xác minh email</CardTitle>
        <CardDescription>
          Hoàn tất bước xác minh để đăng nhập an toàn và dùng đầy đủ tính năng tài khoản.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="flex justify-center">{content.icon}</div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{content.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild>
            <Link href="/login">
              <MailCheck className="size-4" />
              Đi tới đăng nhập
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/verify-email/pending">Gửi lại email xác minh</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
