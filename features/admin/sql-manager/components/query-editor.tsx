"use client"

import { useState } from "react"
import { AlertCircle, Play, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SqlQueryResult } from "@/features/admin/sql-manager/types"

export function QueryEditor() {
  const [query, setQuery] = useState('SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;')
  const [results, setResults] = useState<SqlQueryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function executeQuery() {
    try {
      setIsLoading(true)
      setError(null)
      setResults(null)

      const response = await fetch("/api/admin/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; data?: SqlQueryResult }
        | null

      if (!response.ok || !data?.data) {
        throw new Error(data?.error || "Query execution failed")
      }

      setResults(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query execution failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
          <CardDescription>
            Chạy query trực tiếp cho đọc/ghi dữ liệu. `TRUNCATE` vẫn bị chặn; DDL phức tạp nên đi qua browser CRUD phía trên để an toàn hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder='SELECT * FROM "User" LIMIT 10;'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[220px] font-mono"
          />
          <Button onClick={executeQuery} disabled={isLoading || !query.trim()} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? "Executing..." : "Execute Query"}
          </Button>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Query lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {results ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WandSparkles className="size-4" />
              Results
            </CardTitle>
            <CardDescription>
              {results.executionMode === "read"
                ? `${results.rows.length} row(s) returned`
                : `${results.affectedRows} row(s) affected`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.executionMode === "write" ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Query ghi dữ liệu đã thực thi thành công. Tổng số dòng bị ảnh hưởng:{" "}
                <span className="font-semibold text-foreground">{results.affectedRows}</span>
              </div>
            ) : results.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {results.columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {results.columns.map((col) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            onClick={() => setQuery('SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;')}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Recent users
          </button>
          <button
            onClick={() => setQuery('SELECT role, COUNT(*) as count FROM "User" GROUP BY role ORDER BY count DESC;')}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Count users by role
          </button>
          <button
            onClick={() => setQuery('UPDATE "Product" SET "updatedAt" = NOW() WHERE "status" = \'ACTIVE\';')}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Touch active products
          </button>
          <button
            onClick={() => setQuery('DELETE FROM "Transaction" WHERE "status" = \'FAILED\';')}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Delete failed transactions
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
