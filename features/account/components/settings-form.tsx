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
import { InfoPanel } from "@/features/dashboard/components/info-panel"

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
    <InfoPanel
      description="Cập nhật hồ sơ vận hành của tài khoản cho checkout, billing và các workflow hỗ trợ sau mua."
      eyebrow="Identity settings"
      title="Thông tin tài khoản"
    >
      <Alert className="rounded-[1.15rem] border border-sky-500/15 bg-sky-500/7 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <ShieldCheck className="size-4" />
          <AlertTitle>Scope hiện tại</AlertTitle>
          <AlertDescription>
            Bạn có thể cập nhật tên hiển thị, số điện thoại và ảnh đại diện trong hồ sơ hiện tại.
            Đổi mật khẩu và tuỳ chọn bảo mật nâng cao sẽ được mở rộng tiếp.
          </AlertDescription>
      </Alert>

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="premium-data-item space-y-5 p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account identity</p>
                <p className="text-sm text-muted-foreground">
                  Tên hiển thị sẽ được dùng xuyên suốt checkout, order detail và profile hub.
                </p>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên hiển thị</FormLabel>
                    <FormControl>
                      <Input {...field} className="premium-field h-11" placeholder="NexCloud User" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Email đăng nhập</FormLabel>
                <Input className="premium-field h-11" disabled value={profile.email} />
              </div>
            </div>

            <div className="premium-data-item space-y-5 p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Contact routing</p>
                <p className="text-sm text-muted-foreground">
                  Số điện thoại này được dùng cho xác nhận đơn, billing follow-up và hỗ trợ vận hành.
                </p>
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="premium-field h-11"
                        inputMode="tel"
                        placeholder="0989 123 456"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="border border-sky-500/20 bg-foreground text-background shadow-[0_18px_36px_-24px_rgba(56,189,248,0.48)] transition-all hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-foreground/92 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/92"
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
            <p className="text-sm text-muted-foreground">
              Thay đổi được đồng bộ ngay cho profile, sidebar và session hiện tại.
            </p>
          </div>
        </form>
      </Form>
    </InfoPanel>
  )
}
