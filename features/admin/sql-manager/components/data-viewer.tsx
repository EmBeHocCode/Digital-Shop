"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowDownUp,
  Download,
  Filter,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ColumnEditorDialog } from "./column-editor-dialog"
import { InlineCellEditor } from "./inline-cell-editor"
import { RowEditorDialog } from "./row-editor-dialog"
import type { SqlColumnMetadata, SqlRowsResponse } from "@/features/admin/sql-manager/types"

interface DataViewerProps {
  tableName: string
  onRefreshTables: (preferredTable?: string | null) => Promise<void> | void
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const escapeValue = (value: unknown) => {
    const text =
      value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)

    return `"${text.replaceAll('"', '""')}"`
  }

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeValue(row[column])).join(",")),
  ].join("\n")
}

export function DataViewer({ tableName, onRefreshTables }: DataViewerProps) {
  const [payload, setPayload] = useState<SqlRowsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [limit, setLimit] = useState("25")
  const [offset, setOffset] = useState(0)
  const [rowDialogOpen, setRowDialogOpen] = useState(false)
  const [rowDialogMode, setRowDialogMode] = useState<"create" | "edit">("create")
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  const [columnDialogMode, setColumnDialogMode] = useState<"create" | "edit">("create")
  const [editingColumn, setEditingColumn] = useState<SqlColumnMetadata | null>(null)
  const [showSchemaPanel, setShowSchemaPanel] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        table: tableName,
        limit,
        offset: String(offset),
      })

      if (search.trim()) {
        params.set("search", search.trim())
      }

      if (sortBy) {
        params.set("sortBy", sortBy)
        params.set("sortDirection", sortDirection)
      }

      const response = await fetch(`/api/admin/database/rows?${params.toString()}`)
      const data = (await response.json().catch(() => null)) as
        | (SqlRowsResponse & { error?: string })
        | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to load table data")
      }

      setPayload(data)
      if (!sortBy && data?.sortBy) {
        setSortBy(data.sortBy)
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load table data")
      setPayload(null)
    } finally {
      setIsLoading(false)
    }
  }, [limit, offset, search, sortBy, sortDirection, tableName])

  useEffect(() => {
    setSearch("")
    setSearchInput("")
    setSortBy("")
    setSortDirection("asc")
    setOffset(0)
    setLimit("25")
  }, [tableName])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const columns = useMemo(() => payload?.columns ?? [], [payload?.columns])
  const rows = payload?.rows ?? []
  const primaryKeys = payload?.primaryKeys ?? []
  const canMutateRows = primaryKeys.length > 0
  const rowCountLabel = payload?.total ?? 0
  const currentPage = Math.floor(offset / Number(limit)) + 1
  const totalPages = Math.max(1, Math.ceil((payload?.total ?? 0) / Number(limit)))

  const exportColumns = useMemo(
    () => columns.map((column) => column.columnName),
    [columns]
  )

  const handleRefresh = async () => {
    await fetchData()
    await onRefreshTables(tableName)
  }

  const handleDeleteRow = async (row: Record<string, unknown>) => {
    if (!canMutateRows) {
      toast({
        title: "Không thể xoá bản ghi",
        description: "Bảng này không có primary key nên SQL Manager không thể định danh an toàn.",
        variant: "destructive",
      })
      return
    }

    const keyPreview = primaryKeys.map((key) => `${key}=${String(row[key] ?? "null")}`).join(", ")
    if (!window.confirm(`Xoá bản ghi ${keyPreview}? Hành động này không thể hoàn tác.`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/database/rows", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: tableName,
          where: Object.fromEntries(primaryKeys.map((key) => [key, row[key]])),
        }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể xoá bản ghi")
      }

      toast({
        title: "Đã xoá bản ghi",
        description: `Bản ghi trong bảng ${tableName} đã được xoá.`,
      })
      await handleRefresh()
    } catch (deleteError) {
      toast({
        title: "Không thể xoá dữ liệu",
        description: deleteError instanceof Error ? deleteError.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteColumn = async (column: SqlColumnMetadata) => {
    if (
      !window.confirm(
        `Xoá cột ${column.columnName} khỏi bảng ${tableName}? Hành động này có thể làm mất dữ liệu hiện có.`
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/admin/database/columns", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: tableName,
          columnName: column.columnName,
        }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Không thể xoá cột")
      }

      toast({
        title: "Đã xoá cột",
        description: `Schema bảng ${tableName} đã được cập nhật.`,
      })
      await handleRefresh()
    } catch (deleteError) {
      toast({
        title: "Không thể xoá cột",
        description: deleteError instanceof Error ? deleteError.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải dữ liệu bảng</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className={
        showSchemaPanel
          ? "grid gap-4 2xl:grid-cols-[minmax(0,1.25fr)_320px]"
          : "space-y-6"
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <CardTitle>Data browser</CardTitle>
                <CardDescription>
                  Xem, lọc, phân trang, xuất dữ liệu và chỉnh sửa trực tiếp từng bản ghi.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRowDialogMode("create")
                    setEditingRow(null)
                    setRowDialogOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Thêm dòng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setColumnDialogMode("create")
                    setEditingColumn(null)
                    setColumnDialogOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Thêm cột
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSchemaPanel((current) => !current)}
                >
                  <Info className="size-4" />
                  {showSchemaPanel ? "Ẩn schema" : "Mở schema"}
                </Button>
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="size-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadFile(
                      `${tableName}-${Date.now()}.json`,
                      JSON.stringify(rows, null, 2),
                      "application/json"
                    )
                  }
                  disabled={rows.length === 0}
                >
                  <Download className="size-4" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadFile(
                      `${tableName}-${Date.now()}.csv`,
                      toCsv(rows, exportColumns),
                      "text/csv;charset=utf-8"
                    )
                  }
                  disabled={rows.length === 0}
                >
                  <Download className="size-4" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_160px_140px_120px]">
              <div className="space-y-2">
                <Label htmlFor="sql-manager-search">Tìm kiếm trong bảng</Label>
                <div className="flex gap-2">
                  <Input
                    id="sql-manager-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Tìm theo nội dung cột..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOffset(0)
                      setSearch(searchInput)
                    }}
                  >
                    <Search className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <Select
                  value={sortBy || "__AUTO__"}
                  onValueChange={(value) => {
                    setOffset(0)
                    setSortBy(value === "__AUTO__" ? "" : value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__AUTO__">Auto</SelectItem>
                    {columns.map((column) => (
                      <SelectItem key={column.columnName} value={column.columnName}>
                        {column.columnName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hướng</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                >
                  <span>{sortDirection === "asc" ? "Tăng dần" : "Giảm dần"}</span>
                  <ArrowDownUp className="size-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Số dòng/trang</Label>
                <Select
                  value={limit}
                  onValueChange={(value) => {
                    setOffset(0)
                    setLimit(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{rowCountLabel} rows</Badge>
              <Badge variant="outline">{columns.length} columns</Badge>
              <Badge variant="outline">{primaryKeys.length} primary key</Badge>
              {search ? (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="size-3" />
                  Filter: {search}
                </Badge>
              ) : null}
              {!canMutateRows ? (
                <Badge variant="destructive">Không có primary key, row CRUD bị giới hạn</Badge>
              ) : null}
              <Badge variant="secondary">Bấm trực tiếp vào tên cột để sửa schema</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.columnName} className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (!column.isEditable || column.isPrimaryKey) {
                              return
                            }

                            setColumnDialogMode("edit")
                            setEditingColumn(column)
                            setColumnDialogOpen(true)
                          }}
                          className={`group flex w-full min-w-28 flex-col rounded-md px-1 py-1 text-left transition-colors ${
                            column.isEditable && !column.isPrimaryKey
                              ? "hover:bg-primary/10 cursor-pointer"
                              : "cursor-default"
                          }`}
                          title={
                            column.isEditable && !column.isPrimaryKey
                              ? `Sửa cột ${column.columnName}`
                              : `Cột ${column.columnName} hiện không sửa trực tiếp được`
                          }
                        >
                          <span className="flex items-center gap-2">
                            <span>{column.columnName}</span>
                            {column.isEditable && !column.isPrimaryKey ? (
                              <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                            ) : null}
                          </span>
                          <span
                            className={`text-[11px] font-normal ${
                              column.isEditable && !column.isPrimaryKey
                                ? "text-primary/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {column.dataType}
                          </span>
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Không có dữ liệu phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={`${tableName}-${index}`}>
                        {columns.map((column) => (
                          <TableCell key={`${index}-${column.columnName}`} className="font-mono text-sm">
                            <InlineCellEditor
                              tableName={tableName}
                              row={row}
                              column={column}
                              primaryKeys={primaryKeys}
                              canMutateRows={canMutateRows}
                              onSaved={handleRefresh}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setRowDialogMode("edit")
                                setEditingRow(row)
                                setRowDialogOpen(true)
                              }}
                              disabled={!canMutateRows}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => void handleDeleteRow(row)}
                              disabled={!canMutateRows}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {currentPage}/{totalPages} • hiển thị {rows.length} / {rowCountLabel} dòng
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => setOffset((current) => Math.max(0, current - Number(limit)))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  disabled={!payload?.hasMore}
                  onClick={() => setOffset((current) => current + Number(limit))}
                >
                  Sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showSchemaPanel ? (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Schema</CardTitle>
            <CardDescription>
              Panel phụ để xem metadata cột. Bạn cũng có thể bấm trực tiếp vào header của bảng để sửa nhanh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {columns.map((column) => (
              <div
                key={column.columnName}
                className="rounded-xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{column.columnName}</p>
                    <p className="text-sm text-muted-foreground">{column.dataType}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setColumnDialogMode("edit")
                        setEditingColumn(column)
                        setColumnDialogOpen(true)
                      }}
                      disabled={!column.isEditable || column.isPrimaryKey}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => void handleDeleteColumn(column)}
                      disabled={column.isPrimaryKey}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {column.isPrimaryKey ? <Badge>PK</Badge> : null}
                  {column.isUnique ? <Badge variant="secondary">Unique</Badge> : null}
                  {column.isNullable ? (
                    <Badge variant="outline">Nullable</Badge>
                  ) : (
                    <Badge variant="outline">Required</Badge>
                  )}
                  {column.isIdentity ? <Badge variant="outline">Identity</Badge> : null}
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Default: {column.columnDefault ?? "none"}</p>
                  <p>Editable: {column.isEditable ? "yes" : "no"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <RowEditorDialog
        open={rowDialogOpen}
        tableName={tableName}
        columns={columns}
        primaryKeys={primaryKeys}
        mode={rowDialogMode}
        initialRow={editingRow}
        onOpenChange={setRowDialogOpen}
        onSaved={handleRefresh}
      />

      <ColumnEditorDialog
        open={columnDialogOpen}
        tableName={tableName}
        mode={columnDialogMode}
        column={editingColumn}
        onOpenChange={setColumnDialogOpen}
        onSaved={handleRefresh}
      />
    </div>
  )
}
