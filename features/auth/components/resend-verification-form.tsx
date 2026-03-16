"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  resendVerificationSchema,
  type ResendVerificationInput,
} from "@/features/auth/validations"

interface ResendVerificationFormProps {
  defaultEmail?: string
}

export function ResendVerificationForm({ defaultEmail = "" }: ResendVerificationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const form = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: defaultEmail,
    },
  })

  const handleSubmit = (values: ResendVerificationInput) => {
    setResultMessage(null)
    setIsSuccess(false)

    startTransition(async () => {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null

      setResultMessage(payload?.message ?? "Không thể gửi lại email xác minh lúc này.")
      setIsSuccess(response.ok && Boolean(payload?.success))
    })
  }

  return (
    <div className="space-y-4">
      {resultMessage ? (
        <Alert variant={isSuccess ? "default" : "destructive"}>
          {isSuccess ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <AlertTitle>{isSuccess ? "Đã xử lý yêu cầu" : "Không thể gửi lại email"}</AlertTitle>
          <AlertDescription>{resultMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email đăng ký</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="email" placeholder="you@example.com" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isPending} type="submit" variant="outline">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang gửi lại
              </>
            ) : (
              <>
                <MailCheck className="size-4" />
                Gửi lại email xác minh
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
