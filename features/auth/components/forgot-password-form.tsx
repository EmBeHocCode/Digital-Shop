"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/validations"

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleSubmit = (values: ForgotPasswordInput) => {
    setMessage(null)

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null

      setMessage(payload?.message ?? "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.")
    })
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/25">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập email đăng ký để nhận liên kết đặt lại mật khẩu an toàn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message ? (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Yêu cầu đã được ghi nhận</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Email</FormLabel>
                    <Link
                      href="/login"
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Quay lại đăng nhập
                    </Link>
                  </div>
                  <FormControl>
                    <Input {...field} autoComplete="email" placeholder="you@example.com" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              disabled={isPending}
              size="lg"
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang gửi liên kết
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Gửi liên kết đặt lại mật khẩu
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
