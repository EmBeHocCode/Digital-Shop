"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AdminWalletAdjustmentDialogProps {
  walletId: string
  userLabel: string
}

export function AdminWalletAdjustmentDialog({
  walletId,
  userLabel,
}: AdminWalletAdjustmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/wallet/adjustments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletId,
            amount,
            description,
          }),
        })

        const payload = (await response.json()) as { success?: boolean; message?: string }
        if (!response.ok || !payload.success) {
          setMessage(payload.message ?? "Không thể điều chỉnh ví.")
          return
        }

        setOpen(false)
        setAmount("")
        setDescription("")
        router.refresh()
      } catch {
        setMessage("Không thể kết nối tới admin API.")
      }
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilLine className="size-4" />
          Điều chỉnh
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Điều chỉnh số dư ví</DialogTitle>
          <DialogDescription>
            Tạo transaction `ADJUSTMENT` cho {userLabel}. Dùng số dương để cộng, số âm để trừ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`wallet-adjustment-amount-${walletId}`}>Số tiền</Label>
            <Input
              id={`wallet-adjustment-amount-${walletId}`}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ví dụ: 50000 hoặc -20000"
              value={amount}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`wallet-adjustment-description-${walletId}`}>Mô tả</Label>
            <Textarea
              id={`wallet-adjustment-description-${walletId}`}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Lý do điều chỉnh, người duyệt hoặc mã đối soát nội bộ"
              rows={4}
              value={description}
            />
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>
        <DialogFooter>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Lưu điều chỉnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
