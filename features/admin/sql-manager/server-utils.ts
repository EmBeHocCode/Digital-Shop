import type { PrismaClient } from "@prisma/client"
import { canManageSystemSettings, type UserRole } from "@/lib/auth/role-helpers"
import type { SqlColumnMetadata, SqlTableSummary } from "@/features/admin/sql-manager/types"

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const SQL_TYPE_PATTERN = /^[A-Za-z][A-Za-z0-9_(),\s]*$/

interface SessionLike {
  user?: {
    role?: UserRole | null
  } | null
}

export class SqlManagerError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "SqlManagerError"
    this.status = status
  }
}

export function ensureSqlManagerAccess(session: SessionLike | null | undefined) {
  if (!session?.user?.role || !canManageSystemSettings(session.user.role)) {
    throw new SqlManagerError("Unauthorized", 403)
  }
}

export function quoteIdentifier(identifier: string) {
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new SqlManagerError(`Invalid identifier: ${identifier}`)
  }

  return `"${identifier}"`
}

export function validateSqlType(input: string) {
  const normalizedType = input.trim()

  if (!normalizedType || !SQL_TYPE_PATTERN.test(normalizedType)) {
    throw new SqlManagerError("Invalid SQL type definition")
  }

  return normalizedType
}

export function normalizeLimit(input: string | null | undefined, defaultValue = 25) {
  const parsed = Number.parseInt(input ?? `${defaultValue}`, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue
  }

  return Math.min(parsed, 200)
}

export function normalizeOffset(input: string | null | undefined) {
  const parsed = Number.parseInt(input ?? "0", 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

export function normalizeSortDirection(input: string | null | undefined): "asc" | "desc" {
  return input?.toLowerCase() === "desc" ? "desc" : "asc"
}

function escapeSqlString(value: string) {
  return value.replaceAll("'", "''")
}

export function formatDefaultValueSql(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed
  }

  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  return `'${escapeSqlString(trimmed)}'`
}

export async function getTableColumns(
  prisma: PrismaClient,
  tableName: string
): Promise<SqlColumnMetadata[]> {
  const columns = await prisma.$queryRaw<SqlColumnMetadata[]>`
    SELECT
      c.column_name AS "columnName",
      c.data_type AS "dataType",
      c.udt_name AS "udtName",
      (c.is_nullable = 'YES') AS "isNullable",
      c.column_default AS "columnDefault",
      c.ordinal_position AS "ordinalPosition",
      EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = c.column_name
      ) AS "isPrimaryKey",
      EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = c.column_name
      ) AS "isUnique",
      (c.is_identity = 'YES') AS "isIdentity",
      (c.is_generated <> 'NEVER') AS "isGenerated",
      (
        c.is_identity <> 'YES'
        AND c.is_generated = 'NEVER'
      ) AS "isEditable"
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = ${tableName}
    ORDER BY c.ordinal_position
  `

  if (columns.length === 0) {
    throw new SqlManagerError(`Table "${tableName}" not found`, 404)
  }

  return columns
}

export async function ensureTableExists(prisma: PrismaClient, tableName: string) {
  const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS "exists"
  `

  if (!table[0]?.exists) {
    throw new SqlManagerError(`Table "${tableName}" not found`, 404)
  }
}

export async function ensureColumnExists(
  prisma: PrismaClient,
  tableName: string,
  columnName: string
) {
  const column = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `

  if (!column[0]?.exists) {
    throw new SqlManagerError(`Column "${columnName}" not found`, 404)
  }
}

export function buildPrimaryKeyWhereClause(
  primaryKeys: string[],
  where: Record<string, unknown> | null | undefined
) {
  if (primaryKeys.length === 0) {
    throw new SqlManagerError("This table does not expose a primary key for row mutations")
  }

  if (!where || typeof where !== "object") {
    throw new SqlManagerError("Primary key data is required")
  }

  const values: unknown[] = []
  const clauses = primaryKeys.map((key, index) => {
    if (!(key in where)) {
      throw new SqlManagerError(`Missing primary key value for "${key}"`)
    }

    values.push(where[key])
    return `${quoteIdentifier(key)} = $${index + 1}`
  })

  return {
    clause: clauses.join(" AND "),
    values,
  }
}

export async function getTableSummaries(prisma: PrismaClient): Promise<SqlTableSummary[]> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `

  const summaries = await Promise.all(
    tables.map(async ({ tablename }) => {
      const [countResult, columns] = await Promise.all([
        prisma.$queryRawUnsafe<Array<{ count: string }>>(
          `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier(tablename)}`
        ),
        getTableColumns(prisma, tablename),
      ])

      return {
        name: tablename,
        rowCount: Number.parseInt(countResult[0]?.count ?? "0", 10),
        columnCount: columns.length,
        primaryKeys: columns.filter((column) => column.isPrimaryKey).map((column) => column.columnName),
      }
    })
  )

  return summaries
}

export function serializeCellValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}

export function serializeRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, serializeCellValue(value)])
  )
}

export function normalizeEditablePayload(
  data: Record<string, unknown>,
  columns: SqlColumnMetadata[],
  mode: "insert" | "update"
) {
  const columnMap = new Map(columns.map((column) => [column.columnName, column]))
  const sanitizedEntries = Object.entries(data).filter(([, value]) => value !== undefined)

  if (sanitizedEntries.length === 0) {
    throw new SqlManagerError("No data provided")
  }

  return Object.fromEntries(
    sanitizedEntries.map(([key, value]) => {
      const column = columnMap.get(key)

      if (!column) {
        throw new SqlManagerError(`Unknown column "${key}"`)
      }

      if (!column.isEditable) {
        throw new SqlManagerError(`Column "${key}" is not editable`)
      }

      if (mode === "update" && column.isPrimaryKey) {
        throw new SqlManagerError(`Primary key column "${key}" cannot be edited`)
      }

      return [key, normalizeFieldValue(value)]
    })
  )
}

function normalizeFieldValue(value: unknown) {
  if (value === "") {
    return null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed === "null") {
      return null
    }

    if (trimmed === "true") {
      return true
    }

    if (trimmed === "false") {
      return false
    }
  }

  return value
}
