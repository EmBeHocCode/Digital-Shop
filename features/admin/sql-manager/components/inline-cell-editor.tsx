"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Pencil } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { SqlColumnMetadata } from "@/features/admin/sql-manager/types"

interface InlineCellEditorProps {
  tableName: string
  row: Record<string, unknown>
  column: SqlColumnMetadata
  primaryKeys: string[]
  canMutateRows: boolean
  onSaved: () => Promise<void> | void
}

function isBooleanColumn(column: SqlColumnMetadata) {
  return column.udtName === "bool" || column.dataType.toLowerCase() === "boolean"
}

function isJsonColumn(column: SqlColumnMetadata) {
  return column.udtName === "json" || column.udtName === "jsonb" || column.dataType.toLowerCase().includes("json")
}

function isNumericColumn(column: SqlColumnMetadata) {
  return ["int2", "int4", "int8", "float4", "float8", "numeric"].includes(column.udtName)
}

function shouldUseTextarea(column: SqlColumnMetadata, value: unknown) {
  return (
    isJsonColumn(column) ||
    column.dataType.toLowerCase() === "text" ||
    (typeof value === "string" && value.length > 80)
  )
}

function getInitialValue(value: unknown) {
  if (value == null) {
    return ""
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function renderCellValue(value: unknown) {
  if (value === null) {
    return <span className="text-muted-foreground">null</span>
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

export function InlineCellEditor({
  tableName,
  row,
  column,
  primaryKeys,
  canMutateRows,
  onSaved,
}: InlineCellEditorProps) {
  const [open, setOpen] = useState(false)
  const [draftValue, setDraftValue] = useState("")
  const [isNull, setIsNull] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentValue = row[column.columnName]
  const editable = canMutateRows && column.isEditable && !column.isPrimaryKey
  const usesTextarea = useMemo(
    () => shouldUseTextarea(column, currentValue),
    [column, currentValue]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setDraftValue(getInitialValue(currentValue))
    setIsNull(currentValue === null)
  }, [currentValue, open])

  const triggerTitle = editable
    ? `Double-click để sửa ${column.columnName}`
    : `Không thể sửa trực tiếp cột ${column.columnName}`

  async function handleSave() {
    setIsSaving(true)

    try {
      let nextValue: unknown = draftValue

      if (isNull) {
        nextValue = null
      } else if (isBooleanColumn(column)) {
        nextValue = draftValue === "true"
      } else if (isNumericColumn(column) && draftValue.trim() !== "") {
        const numericValue = Number(draftValue)
        if (Number.isNaN(numericValue)) {
          throw new Error("Giá trị số không hợp lệ.")
        }
        nextValue = numericValue
      } else if (isJsonColumn(column) && draftValue.trim() !== "") {
        nextValue = JSON.parse(draftValue)
      }

      const response = await fetch("/api/admin/database/rows", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: tableName,
          data: {
            [column.columnName]: nextValue,
          },
          where: Object.fromEntries(primaryKeys.map((key) => [key, row[key]])),
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Không thể cập nhật ô dữ liệu")
      }

      toast({
        title: "Đã cập nhật ô dữ liệu",
        description: `${column.columnName} trong bảng ${tableName} đã được lưu.`,
      })
      setOpen(false)
      await onSaved()
    } catch (error) {
      toast({
        title: "Không thể lưu ô dữ liệu",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role={editable ? "button" : undefined}
          tabIndex={editable ? 0 : -1}
          title={triggerTitle}
          onDoubleClick={(event) => {
            if (!editable) {
              return
            }

            event.preventDefault()
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (!editable) {
              return
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              setOpen(true)
            }
          }}
          className={`group rounded-md px-1 py-1 outline-none transition-colors ${
            editable ? "cursor-text hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/60" : ""
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="max-w-[220px] truncate">{renderCellValue(currentValue)}</div>
            {editable ? (
              <Pencil className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50 group-focus:opacity-50" />
            ) : null}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground">{column.columnName}</p>
            <Badge variant="outline">{column.dataType}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Double-click trong bảng để mở form này. Enter để lưu nhanh.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`inline-${column.columnName}`}>Giá trị</Label>
          {isBooleanColumn(column) ? (
            <Select
              value={isNull ? "__NULL__" : draftValue || "false"}
              onValueChange={(value) => {
                if (value === "__NULL__") {
                  setIsNull(true)
                  setDraftValue("")
                  return
                }

                setIsNull(false)
                setDraftValue(value)
              }}
            >
              <SelectTrigger id={`inline-${column.columnName}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.isNullable ? <SelectItem value="__NULL__">null</SelectItem> : null}
                <SelectItem value="true">true</SelectItem>
                <SelectItem value="false">false</SelectItem>
              </SelectContent>
            </Select>
          ) : usesTextarea ? (
            <Textarea
              id={`inline-${column.columnName}`}
              value={draftValue}
              onChange={(event) => {
                setIsNull(false)
                setDraftValue(event.target.value)
              }}
              className="min-h-24 font-mono"
            />
          ) : (
            <Input
              id={`inline-${column.columnName}`}
              value={draftValue}
              onChange={(event) => {
                setIsNull(false)
                setDraftValue(event.target.value)
              }}
              className="font-mono"
            />
          )}
        </div>

        {column.isNullable ? (
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
            <Checkbox
              id={`inline-null-${column.columnName}`}
              checked={isNull}
              onCheckedChange={(checked) => setIsNull(checked === true)}
            />
            <Label htmlFor={`inline-null-${column.columnName}`}>Lưu giá trị NULL</Label>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu
              </>
            ) : (
              <>
                <Check className="size-4" />
                Lưu ô này
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
