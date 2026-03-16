"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { SqlColumnMetadata } from "@/features/admin/sql-manager/types"

interface RowEditorDialogProps {
  open: boolean
  tableName: string
  columns: SqlColumnMetadata[]
  primaryKeys: string[]
  mode: "create" | "edit"
  initialRow?: Record<string, unknown> | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void> | void
}

function formatInitialValue(value: unknown) {
  if (value == null) {
    return ""
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function isJsonColumn(column: SqlColumnMetadata) {
  return column.dataType.toLowerCase().includes("json")
}

function isBooleanColumn(column: SqlColumnMetadata) {
  return column.dataType.toLowerCase() === "boolean"
}

export function RowEditorDialog({
  open,
  tableName,
  columns,
  primaryKeys,
  mode,
  initialRow,
  onOpenChange,
  onSaved,
}: RowEditorDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const editableColumns = useMemo(
    () =>
      columns.filter((column) => column.isEditable && (mode === "create" || !column.isPrimaryKey)),
    [columns, mode]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const nextValues = Object.fromEntries(
      editableColumns.map((column) => [
        column.columnName,
        formatInitialValue(initialRow?.[column.columnName]),
      ])
    )
    setValues(nextValues)
  }, [editableColumns, initialRow, open])

  async function handleSubmit() {
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => {
        const column = editableColumns.find((item) => item.columnName === key)

        if (column && isJsonColumn(column) && value.trim()) {
          try {
            return [key, JSON.parse(value)]
          } catch {
            return [key, value]
          }
        }

        if (column && isBooleanColumn(column)) {
          if (value === "__NULL__") {
            return [key, null]
          }

          return [key, value]
        }

        return [key, value]
      })
    )

    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/database/rows", {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: tableName,
          data: payload,
          where:
            mode === "edit" && initialRow
              ? Object.fromEntries(primaryKeys.map((key) => [key, initialRow[key]]))
              : undefined,
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể lưu bản ghi")
      }

      toast({
        title: mode === "create" ? "Đã thêm bản ghi" : "Đã cập nhật bản ghi",
        description: `Bảng ${tableName} đã được cập nhật.`,
      })
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast({
        title: "Không thể lưu dữ liệu",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm bản ghi mới" : "Chỉnh sửa bản ghi"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Nhập dữ liệu cho bảng ${tableName}. Các trường để trống sẽ được gửi dưới dạng null nếu cột cho phép.`
              : `Cập nhật dữ liệu đang chọn trong bảng ${tableName}. Khóa chính được giữ cố định để đảm bảo an toàn.`}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && initialRow ? (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
            <p className="font-medium text-foreground">Định danh bản ghi</p>
            <div className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
              {primaryKeys.map((key) => (
                <span key={key} className="rounded-md border border-border/70 bg-background px-2 py-1">
                  {key}: {String(initialRow[key] ?? "null")}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
          {editableColumns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có cột nào khả dụng để {mode === "create" ? "thêm" : "chỉnh sửa"}.
            </p>
          ) : null}

          {editableColumns.map((column) => (
            <div key={column.columnName} className={isJsonColumn(column) ? "md:col-span-2" : undefined}>
              <Label className="mb-2 block" htmlFor={`${mode}-${column.columnName}`}>
                {column.columnName}
                <span className="ml-2 text-xs text-muted-foreground">{column.dataType}</span>
              </Label>

              {isBooleanColumn(column) ? (
                <Select
                  value={
                    values[column.columnName] === ""
                      ? column.isNullable
                        ? "__NULL__"
                        : "false"
                      : values[column.columnName]
                  }
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      [column.columnName]: value,
                    }))
                  }
                >
                  <SelectTrigger id={`${mode}-${column.columnName}`} className="w-full">
                    <SelectValue placeholder="Chọn giá trị" />
                  </SelectTrigger>
                  <SelectContent>
                    {column.isNullable ? <SelectItem value="__NULL__">null</SelectItem> : null}
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : isJsonColumn(column) ? (
                <Textarea
                  id={`${mode}-${column.columnName}`}
                  value={values[column.columnName] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [column.columnName]: event.target.value,
                    }))
                  }
                  className="min-h-28 font-mono"
                  placeholder='{"key": "value"}'
                />
              ) : (
                <Input
                  id={`${mode}-${column.columnName}`}
                  value={values[column.columnName] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [column.columnName]: event.target.value,
                    }))
                  }
                  placeholder={column.columnDefault ? `Default: ${column.columnDefault}` : "Nhập giá trị"}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || editableColumns.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu
              </>
            ) : mode === "create" ? (
              "Thêm bản ghi"
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
