"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"
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
  updateUserSettingsSchema,
  type UpdateUserSettingsInput,
} from "@/features/account/validations"
import type { UserSettingsProfile } from "@/features/account/services/get-user-settings"

interface SettingsFormProps {
  profile: UserSettingsProfile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const { update } = useSession()
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateUserSettingsInput>({
    resolver: zodResolver(updateUserSettingsSchema),
    defaultValues: {
      name: profile.name ?? "",
      phone: profile.phone ?? "",
    },
  })

  const handleSubmit = (values: UpdateUserSettingsInput) => {
    startTransition(async () => {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean
            message?: string
            user?: {
              name: string | null
              email: string
              phone: string | null
            }
          }
        | null

      if (!response.ok || !payload?.success) {
        toast({
          title: "Không thể cập nhật hồ sơ",
          description: payload?.message ?? "Vui lòng thử lại sau.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Đã cập nhật thông tin",
        description: "Hồ sơ tài khoản đã được lưu.",
      })
      form.reset({
        name: payload.user?.name ?? values.name,
        phone: payload.user?.phone ?? values.phone,
      })
      await update({
        name: payload.user?.name ?? values.name,
        email: payload.user?.email ?? profile.email,
        phone: payload.user?.phone ?? values.phone ?? null,
      })
      router.refresh()
    })
  }

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>Thông tin tài khoản</CardTitle>
        <CardDescription>
          Cập nhật tên hiển thị và số điện thoại dùng cho checkout, billing và hỗ trợ vận hành.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <ShieldCheck className="size-4" />
          <AlertTitle>Scope hiện tại</AlertTitle>
          <AlertDescription>
            Phase 6 mới mở cập nhật profile cơ bản. Phần đổi mật khẩu và tuỳ chọn nâng cao sẽ đi
            tiếp ở phase sau.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên hiển thị</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NexCloud User" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Email đăng nhập</FormLabel>
                <Input disabled value={profile.email} />
              </div>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="tel" placeholder="0989 123 456" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
