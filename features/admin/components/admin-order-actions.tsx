"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AdminOrderActionsProps {
  orderId: string
  paymentStatus: string
}

const actionOptions = [
  { value: "mark-reviewed", label: "Ghi nhận đã review" },
  { value: "set-processing", label: "Đang xử lý" },
  { value: "set-completed", label: "Hoàn tất" },
  { value: "set-cancelled", label: "Hủy đơn" },
  { value: "request-refund", label: "Tạo yêu cầu hoàn tiền" },
] as const

export function AdminOrderActions({ orderId, paymentStatus }: AdminOrderActionsProps) {
  const router = useRouter()
  const [selectedAction, setSelectedAction] = useState<(typeof actionOptions)[number]["value"]>(
    "set-processing"
  )
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isRefundActionDisabled = useMemo(
    () => selectedAction === "request-refund" && paymentStatus !== "COMPLETED",
    [paymentStatus, selectedAction]
  )

  function buildPayload() {
    switch (selectedAction) {
      case "mark-reviewed":
        return {
          action: "mark-reviewed",
        }
      case "set-processing":
        return {
          action: "set-status",
          status: "PROCESSING",
        }
      case "set-completed":
        return {
          action: "set-status",
          status: "COMPLETED",
          paymentStatus: paymentStatus === "COMPLETED" ? "COMPLETED" : undefined,
        }
      case "set-cancelled":
        return {
          action: "set-status",
          status: "CANCELLED",
          paymentStatus: paymentStatus === "PENDING" ? "CANCELLED" : undefined,
        }
      case "request-refund":
        return {
          action: "request-refund",
          reason: "Admin initiated refund review request",
        }
    }
  }

  function handleSubmit() {
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        })

        const payload = (await response.json()) as { success?: boolean; message?: string }

        if (!response.ok || !payload.success) {
          setMessage(payload.message ?? "Không thể cập nhật đơn hàng.")
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
        <Select onValueChange={(value) => setSelectedAction(value as typeof selectedAction)} value={selectedAction}>
          <SelectTrigger className="w-full xl:w-[220px]">
            <SelectValue placeholder="Chọn thao tác" />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={isPending || isRefundActionDisabled} onClick={handleSubmit} size="sm">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Áp dụng
        </Button>
      </div>
      {isRefundActionDisabled ? (
        <p className="text-xs text-muted-foreground">Chỉ khởi tạo refund khi thanh toán đã completed.</p>
      ) : null}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}
