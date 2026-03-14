"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablesView } from "./components/tables-view"
import { QueryEditor } from "./components/query-editor"
import { Database } from "lucide-react"

interface Table {
  name: string
  rowCount: number
}

export function SqlManagerClient() {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/database/tables")
      if (!response.ok) throw new Error("Failed to fetch tables")
      const data = await response.json()
      setTables(data.tables)
      if (data.tables.length > 0 && !selectedTable) {
        setSelectedTable(data.tables[0].name)
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTable])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <div>
          <h1 className="text-3xl font-bold">SQL Manager</h1>
          <p className="text-muted-foreground">
            Manage your database tables and execute queries safely
          </p>
        </div>
      </div>

      <Tabs defaultValue="browser" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="browser">Table Browser</TabsTrigger>
          <TabsTrigger value="query">Query Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <TablesView
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            isLoading={isLoading}
            onRefresh={fetchTables}
          />
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <QueryEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
