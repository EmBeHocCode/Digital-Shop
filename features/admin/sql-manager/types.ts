export interface SqlTableSummary {
  name: string
  rowCount: number
  columnCount: number
  primaryKeys: string[]
}

export interface SqlColumnMetadata {
  columnName: string
  dataType: string
  udtName: string
  isNullable: boolean
  columnDefault: string | null
  ordinalPosition: number
  isPrimaryKey: boolean
  isUnique: boolean
  isIdentity: boolean
  isGenerated: boolean
  isEditable: boolean
}

export interface SqlRowsResponse {
  rows: Record<string, unknown>[]
  columns: SqlColumnMetadata[]
  primaryKeys: string[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  sortBy: string | null
  sortDirection: "asc" | "desc"
  search: string
}

export interface SqlQueryResult {
  rows: Record<string, unknown>[]
  columns: string[]
  executionMode: "read" | "write"
  affectedRows: number
}

