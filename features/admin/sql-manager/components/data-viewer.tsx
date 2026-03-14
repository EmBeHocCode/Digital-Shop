"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DataViewerProps {
  tableName: string
}

interface ColumnRecord {
  column_name: string
}

type DataRow = Record<string, unknown>

export function DataViewer({ tableName }: DataViewerProps) {
  const [rows, setRows] = useState<DataRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const colResponse = await fetch(`/api/admin/database/columns?table=${tableName}`)
        if (!colResponse.ok) throw new Error("Failed to fetch columns")
        const colData = (await colResponse.json()) as { columns?: ColumnRecord[] }
        setColumns((colData.columns ?? []).map((column) => column.column_name))

        const rowResponse = await fetch(
          `/api/admin/database/rows?table=${tableName}&limit=100&offset=0`
        )
        if (!rowResponse.ok) throw new Error("Failed to fetch rows")
        const rowData = (await rowResponse.json()) as { rows?: DataRow[] }
        setRows(rowData.rows ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [tableName])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                No data found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={`${idx}-${col}`} className="font-mono text-sm">
                    <div className="max-w-xs truncate">
                      {row[col] === null
                        ? <span className="text-muted-foreground">null</span>
                        : typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : String(row[col])}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
