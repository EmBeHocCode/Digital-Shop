"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { AlertCircle, Loader2 } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signInSchema, type SignInInput } from "@/features/auth/validations"
import { resolvePostAuthPath } from "@/lib/auth/role-helpers"

interface LoginFormProps {
  callbackUrl: string
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      website: "",
    },
  })

  const handleSubmit = (values: SignInInput) => {
    setFormError(null)
    setVerificationEmail(null)

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        website: values.website ?? "",
        redirect: false,
        callbackUrl,
      })

      if (!result || result.error) {
        if (result?.error?.includes("EMAIL_NOT_VERIFIED")) {
          setVerificationEmail(values.email)
          setFormError("Email của bạn chưa được xác minh. Hãy kiểm tra hộp thư hoặc gửi lại liên kết xác minh.")
          return
        }

        if (result?.error?.includes("ACCOUNT_INACTIVE")) {
          setFormError("Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ hỗ trợ.")
          return
        }

        if (result?.error?.includes("DATABASE_UNAVAILABLE")) {
          setFormError("Database chưa sẵn sàng. Hãy bật PostgreSQL hoặc Docker rồi thử lại.")
          return
        }

        setFormError("Thông tin đăng nhập chưa đúng.")
        return
      }

      const session = await getSession()
      const redirectPath = resolvePostAuthPath(session?.user?.role, result.url ?? callbackUrl)

      router.push(redirectPath)
      router.refresh()
    })
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur dark:shadow-black/25">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Tiếp tục để quay về trang chủ hoặc mở dashboard nếu tài khoản của bạn có quyền quản lý.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Không thể đăng nhập</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{formError}</p>
              {verificationEmail ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/verify-email/pending?email=${encodeURIComponent(verificationEmail)}`}>
                    Gửi lại email xác minh
                  </Link>
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                {...form.register("website")}
                autoComplete="off"
                id="website"
                tabIndex={-1}
                type="text"
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="email"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Mật khẩu</FormLabel>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <Link
                        href="/forgot-password"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Quên mật khẩu?
                      </Link>
                      <Link
                        href="/register"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Chưa có tài khoản?
                      </Link>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      type="password"
                    />
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
                  Đang đăng nhập
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
