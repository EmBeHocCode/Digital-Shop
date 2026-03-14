"use client"

import { useState } from "react"
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
import { AlertCircle, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function QueryEditor() {
  const [query, setQuery] = useState('SELECT * FROM "User" LIMIT 10;')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executed, setExecuted] = useState(false)

  async function executeQuery() {
    try {
      setIsLoading(true)
      setError(null)
      setResults([])
      setColumns([])
      setExecuted(false)

      const response = await fetch("/api/admin/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Query execution failed")
      }

      if (Array.isArray(data.data) && data.data.length > 0) {
        setColumns(Object.keys(data.data[0]))
        setResults(data.data as Record<string, unknown>[])
      } else if (typeof data.data === "object" && data.data !== null) {
        setColumns(Object.keys(data.data))
        setResults([data.data as Record<string, unknown>])
      } else {
        setResults([])
        setColumns([])
      }

      setExecuted(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Query execution failed"
      setError(errorMessage)
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
            Execute SELECT queries to explore your data. DDL operations are disabled for safety.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder='SELECT * FROM "User" LIMIT 10;'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono min-h-[200px]"
          />
          <Button
            onClick={executeQuery}
            disabled={isLoading || !query.trim()}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? "Executing..." : "Execute Query"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {executed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>
              {results.length} row{results.length !== 1 ? "s" : ""} returned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results</p>
            ) : (
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
                    {results.map((row, idx) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Common Queries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            onClick={() => setQuery('SELECT * FROM "User" LIMIT 10;')}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
          >
            View Users
          </button>
          <button
            onClick={() => setQuery('SELECT role, COUNT(*) as count FROM "User" GROUP BY role;')}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
          >
            Count by Role
          </button>
          <button
            onClick={() => setQuery('SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;')}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
          >
            Recent Orders
          </button>
          <button
            onClick={() => setQuery('SELECT * FROM "Product" WHERE status = \'ACTIVE\' LIMIT 10;')}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted"
          >
            Active Products
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
