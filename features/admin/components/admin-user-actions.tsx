"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ManagedRole = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN" | "SUPERADMIN"

interface AdminUserActionsProps {
  userId: string
  currentRole: ManagedRole
  isActive: boolean
  isSelf?: boolean
}

const roles: ManagedRole[] = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPERADMIN"]

export function AdminUserActions({
  userId,
  currentRole,
  isActive,
  isSelf = false,
}: AdminUserActionsProps) {
  const router = useRouter()
  const [role, setRole] = useState<ManagedRole>(currentRole)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(payload: { role?: ManagedRole; isActive?: boolean }) {
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
        const data = (await response.json()) as { success?: boolean; message?: string }
        if (!response.ok || !data.success) {
          setMessage(data.message ?? "Không thể cập nhật tài khoản.")
          return
        }
        router.refresh()
      } catch {
        setMessage("Không thể kết nối tới admin API.")
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 xl:flex-row">
        <Select disabled={isPending || isSelf} onValueChange={(value) => setRole(value as ManagedRole)} value={role}>
          <SelectTrigger className="w-full xl:w-[170px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={isPending || isSelf || role === currentRole}
          onClick={() => submit({ role })}
          size="sm"
          variant="outline"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Lưu role
        </Button>
        <Button
          disabled={isPending || isSelf}
          onClick={() => submit({ isActive: !isActive })}
          size="sm"
          variant={isActive ? "destructive" : "default"}
        >
          {isActive ? "Khoá" : "Mở khoá"}
        </Button>
      </div>
      {isSelf ? <p className="text-xs text-muted-foreground">Không chỉnh role/trạng thái của chính bạn tại đây.</p> : null}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}
