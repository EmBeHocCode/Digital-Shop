"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { HumanVerificationChallenge } from "@/lib/auth/human-verification"
import { resolvePostAuthPath } from "@/lib/auth/role-helpers"

interface LoginFormProps {
  callbackUrl: string
  challenge: HumanVerificationChallenge
}

export function LoginForm({ callbackUrl, challenge }: LoginFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      humanCheck: false,
      humanAnswer: "",
      humanToken: challenge.token,
      website: "",
    },
  })

  const handleSubmit = (values: SignInInput) => {
    setFormError(null)

    const expectedAnswer = String(challenge.firstOperand + challenge.secondOperand)

    if (values.humanAnswer.trim() !== expectedAnswer) {
      form.setError("humanAnswer", {
        message: "Kết quả xác thực chưa đúng.",
      })
      return
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        humanCheck: values.humanCheck,
        humanAnswer: values.humanAnswer,
        humanToken: values.humanToken,
        website: values.website ?? "",
        redirect: false,
        callbackUrl,
      })

      if (!result || result.error) {
        setFormError("Thông tin đăng nhập hoặc xác thực người dùng chưa đúng.")
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
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <input {...form.register("humanToken")} type="hidden" />
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
                    <Link
                      href="/register"
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Chưa có tài khoản?
                    </Link>
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

            <div className="rounded-2xl border border-border/80 bg-muted/25 p-4 shadow-sm shadow-black/5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldCheck className="size-4" />
                    Xác thực đăng nhập
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Đánh dấu xác nhận và nhập kết quả phép tính để tiếp tục.
                  </p>
                </div>
                <Button
                  className="h-8 px-3 text-xs"
                  onClick={() => router.refresh()}
                  type="button"
                  variant="ghost"
                >
                  <RefreshCw className="size-3.5" />
                  Làm mới
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="humanCheck"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 rounded-xl border border-border/70 bg-background/70 p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="ml-3 space-y-1">
                        <FormLabel className="text-sm font-medium">
                          Tôi xác nhận mình không phải robot
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Xác nhận này giúp chặn các lượt đăng nhập tự động.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="humanAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{challenge.prompt}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="off"
                          inputMode="numeric"
                          placeholder="Ví dụ: 12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
