"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SqlColumnMetadata } from "@/features/admin/sql-manager/types"

interface ColumnEditorDialogProps {
  open: boolean
  tableName: string
  mode: "create" | "edit"
  column?: SqlColumnMetadata | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void> | void
}

export function ColumnEditorDialog({
  open,
  tableName,
  mode,
  column,
  onOpenChange,
  onSaved,
}: ColumnEditorDialogProps) {
  const [columnName, setColumnName] = useState("")
  const [dataType, setDataType] = useState("TEXT")
  const [defaultValue, setDefaultValue] = useState("")
  const [isNullable, setIsNullable] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setColumnName(column?.columnName ?? "")
    setDataType(column?.dataType?.toUpperCase() ?? "TEXT")
    setDefaultValue(column?.columnDefault ?? "")
    setIsNullable(column?.isNullable ?? true)
  }, [column, open])

  async function handleSubmit() {
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/database/columns", {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: tableName,
          columnName: column?.columnName ?? columnName,
          nextName: mode === "edit" ? columnName : undefined,
          dataType,
          isNullable,
          defaultValue,
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể cập nhật cột")
      }

      toast({
        title: mode === "create" ? "Đã thêm cột" : "Đã cập nhật cột",
        description: `Bảng ${tableName} đã được cập nhật schema.`,
      })
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast({
        title: "Không thể lưu cột",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm cột mới" : "Chỉnh sửa cột"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Thêm cột mới vào bảng ${tableName}.`
              : `Chỉnh sửa metadata của cột trong bảng ${tableName}. Tránh đổi kiểu dữ liệu khi dữ liệu cũ không còn tương thích.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Tên cột</Label>
            <Input
              id="column-name"
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
              placeholder="newColumn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column-type">Kiểu SQL</Label>
            <Input
              id="column-type"
              value={dataType}
              onChange={(event) => setDataType(event.target.value)}
              placeholder="TEXT, VARCHAR(255), INTEGER, JSONB..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column-default">Default value</Label>
            <Input
              id="column-default"
              value={defaultValue}
              onChange={(event) => setDefaultValue(event.target.value)}
              placeholder="Để trống nếu không dùng default"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
            <Checkbox
              id="column-nullable"
              checked={isNullable}
              onCheckedChange={(checked) => setIsNullable(checked === true)}
            />
            <Label htmlFor="column-nullable" className="cursor-pointer">
              Cho phép null
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !columnName.trim() || !dataType.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu
              </>
            ) : mode === "create" ? (
              "Thêm cột"
            ) : (
              "Lưu cột"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
