"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react"
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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/validations"

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const isTokenMissing = useMemo(() => token.trim().length === 0, [token])
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = (values: ResetPasswordInput) => {
    setFormMessage(null)
    setIsSuccess(false)

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null

      setFormMessage(payload?.message ?? "Không thể cập nhật mật khẩu lúc này.")
      setIsSuccess(response.ok && Boolean(payload?.success))
    })
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/25">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Tạo mật khẩu mới để tiếp tục đăng nhập vào NexCloud.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formMessage ? (
          <Alert variant={isSuccess ? "default" : "destructive"}>
            {isSuccess ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            <AlertTitle>{isSuccess ? "Đã cập nhật mật khẩu" : "Không thể đặt lại mật khẩu"}</AlertTitle>
            <AlertDescription>{formMessage}</AlertDescription>
          </Alert>
        ) : null}

        {isTokenMissing ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Thiếu token đặt lại mật khẩu</AlertTitle>
            <AlertDescription>
              Liên kết này không hợp lệ hoặc đã bị cắt bớt. Hãy yêu cầu một email đặt lại mật khẩu mới.
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <input {...form.register("token")} type="hidden" />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        placeholder="Tối thiểu 8 ký tự"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <Link
                        href="/login"
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Quay lại đăng nhập
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              className="w-full bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              disabled={isPending || isTokenMissing}
              size="lg"
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang cập nhật mật khẩu
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" />
                  Lưu mật khẩu mới
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
