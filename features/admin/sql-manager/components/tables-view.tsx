"use client"

import { useMemo, useState } from "react"
import { Database, Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DataViewer } from "./data-viewer"
import type { SqlTableSummary } from "@/features/admin/sql-manager/types"

interface TablesViewProps {
  tables: SqlTableSummary[]
  selectedTable: string | null
  onSelectTable: (table: string) => void
  isLoading: boolean
  onRefresh: (preferredTable?: string | null) => Promise<void> | void
}

export function TablesView({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
  onRefresh,
}: TablesViewProps) {
  const [showViewer, setShowViewer] = useState(false)
  const [tableSearch, setTableSearch] = useState("")

  const filteredTables = useMemo(
    () =>
      tables.filter((table) =>
        table.name.toLowerCase().includes(tableSearch.trim().toLowerCase())
      ),
    [tableSearch, tables]
  )

  async function createTable() {
    const name = window.prompt("Tên bảng mới", "")
    if (!name?.trim()) {
      return
    }

    try {
      const response = await fetch("/api/admin/database/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể tạo bảng")
      }

      toast({
        title: "Đã tạo bảng",
        description: `Bảng ${name.trim()} đã được tạo.`,
      })
      onSelectTable(name.trim())
      setShowViewer(true)
      await onRefresh(name.trim())
    } catch (error) {
      toast({
        title: "Không thể tạo bảng",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  async function renameTable() {
    if (!selectedTable) {
      return
    }

    const nextName = window.prompt("Tên bảng mới", selectedTable)
    if (!nextName?.trim() || nextName.trim() === selectedTable) {
      return
    }

    try {
      const response = await fetch("/api/admin/database/tables", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: selectedTable,
          nextName: nextName.trim(),
        }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể đổi tên bảng")
      }

      toast({
        title: "Đã đổi tên bảng",
        description: `${selectedTable} -> ${nextName.trim()}`,
      })
      onSelectTable(nextName.trim())
      await onRefresh(nextName.trim())
    } catch (error) {
      toast({
        title: "Không thể đổi tên bảng",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  async function deleteTable() {
    if (!selectedTable) {
      return
    }

    if (
      !window.confirm(
        `Xoá bảng ${selectedTable}? Hành động này sẽ xoá toàn bộ dữ liệu của bảng đang chọn.`
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/admin/database/tables", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: selectedTable,
        }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể xoá bảng")
      }

      toast({
        title: "Đã xoá bảng",
        description: `Bảng ${selectedTable} đã được xoá.`,
      })
      setShowViewer(false)
      await onRefresh(null)
    } catch (error) {
      toast({
        title: "Không thể xoá bảng",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Tables</CardTitle>
              <CardDescription>
                {tables.length} bảng trong schema public
              </CardDescription>
            </div>
            <Button size="icon" variant="outline" onClick={() => void onRefresh(selectedTable)}>
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              placeholder="Tìm bảng..."
            />
            <Button size="icon" variant="outline">
              <Search className="size-4" />
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={createTable}>
              <Plus className="size-4" />
              Tạo bảng
            </Button>
            <Button variant="outline" onClick={renameTable} disabled={!selectedTable}>
              <Pencil className="size-4" />
              Đổi tên
            </Button>
            <Button variant="outline" onClick={deleteTable} disabled={!selectedTable}>
              <Trash2 className="size-4" />
              Xoá bảng
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowViewer((current) => !current)}
              disabled={!selectedTable}
            >
              <Eye className="size-4" />
              {showViewer ? "Ẩn dữ liệu" : "Mở dữ liệu"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy bảng phù hợp.
            </div>
          ) : (
            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {filteredTables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => {
                    onSelectTable(table.name)
                    setShowViewer(true)
                  }}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    selectedTable === table.name
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/70 bg-muted/30 hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Database className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {table.rowCount} rows • {table.columnCount} columns
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {table.primaryKeys.length} PK
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{selectedTable ? selectedTable : "Chọn một bảng"}</CardTitle>
            <CardDescription>
              Table browser, schema editor, row CRUD, filter, export và paging.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => void onRefresh(selectedTable)} disabled={isLoading}>
            <RefreshCw className="size-4" />
            Đồng bộ
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedTable ? (
            showViewer ? (
              <DataViewer key={selectedTable} tableName={selectedTable} onRefreshTables={onRefresh} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Chọn “Mở dữ liệu” để quản lý nội dung và schema của bảng đang chọn.
              </p>
            )
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chọn một bảng ở danh sách bên trái để bắt đầu quản lý dữ liệu SQL.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
