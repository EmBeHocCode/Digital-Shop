"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Eye } from "lucide-react"
import { DataViewer } from "./data-viewer"
import { Skeleton } from "@/components/ui/skeleton"

interface Table {
  name: string
  rowCount: number
}

interface TablesViewProps {
  tables: Table[]
  selectedTable: string | null
  onSelectTable: (table: string) => void
  isLoading: boolean
  onRefresh: () => void
}

export function TablesView({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
  onRefresh,
}: TablesViewProps) {
  const [showViewer, setShowViewer] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Tables List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tables</CardTitle>
          <CardDescription>
            {tables.length} table{tables.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tables found</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => {
                    onSelectTable(table.name)
                    setShowViewer(true)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTable === table.name
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{table.name}</span>
                    <span className="text-xs opacity-70 ml-2">{table.rowCount}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>
              {selectedTable ? selectedTable : "Select a table"}
            </CardTitle>
            <CardDescription>
              View and manage table data, columns, and records
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {selectedTable && (
              <Button
                size="sm"
                onClick={() => setShowViewer(!showViewer)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showViewer ? "Hide" : "View"} Data
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedTable ? (
            showViewer ? (
              <DataViewer tableName={selectedTable} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click &quot;View Data&quot; to see table contents
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a table from the list to view its data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
