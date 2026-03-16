import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import {
  buildPrimaryKeyWhereClause,
  ensureSqlManagerAccess,
  getTableColumns,
  normalizeEditablePayload,
  normalizeLimit,
  normalizeOffset,
  normalizeSortDirection,
  quoteIdentifier,
  serializeRow,
  SqlManagerError,
} from "@/features/admin/sql-manager/server-utils"
import type { SqlRowsResponse } from "@/features/admin/sql-manager/types"

function handleError(error: unknown, context: string) {
  console.error(context, error)

  if (error instanceof SqlManagerError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json({ error: "Database manager action failed" }, { status: 500 })
}

function createSearchClause(columns: string[], search: string) {
  if (!search.trim()) {
    return { clause: "", values: [] as unknown[] }
  }

  const searchValue = `%${search.trim()}%`
  const searchParts = columns.map(
    (column, index) => `CAST(${quoteIdentifier(column)} AS TEXT) ILIKE $${index + 1}`
  )

  return {
    clause: `WHERE (${searchParts.join(" OR ")})`,
    values: columns.map(() => searchValue),
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const tableName = req.nextUrl.searchParams.get("table")
    if (!tableName) {
      throw new SqlManagerError("Table name required")
    }

    const limit = normalizeLimit(req.nextUrl.searchParams.get("limit"))
    const offset = normalizeOffset(req.nextUrl.searchParams.get("offset"))
    const search = req.nextUrl.searchParams.get("search") ?? ""
    const sortBy = req.nextUrl.searchParams.get("sortBy")
    const sortDirection = normalizeSortDirection(req.nextUrl.searchParams.get("sortDirection"))

    const prisma = getPrismaClient()
    const columns = await getTableColumns(prisma, tableName)
    const columnNames = columns.map((column) => column.columnName)
    const primaryKeys = columns.filter((column) => column.isPrimaryKey).map((column) => column.columnName)

    if (sortBy && !columnNames.includes(sortBy)) {
      throw new SqlManagerError(`Unknown sort column "${sortBy}"`)
    }

    const searchState = createSearchClause(columnNames, search)
    const orderColumn =
      sortBy ?? primaryKeys[0] ?? columns.find((column) => column.isEditable)?.columnName ?? columns[0]?.columnName
    const orderClause = orderColumn
      ? `ORDER BY ${quoteIdentifier(orderColumn)} ${sortDirection.toUpperCase()}`
      : ""

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      [
        `SELECT * FROM ${quoteIdentifier(tableName)}`,
        searchState.clause,
        orderClause,
        `LIMIT ${limit}`,
        `OFFSET ${offset}`,
      ]
        .filter(Boolean)
        .join(" "),
      ...searchState.values
    )

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      [
        `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier(tableName)}`,
        searchState.clause,
      ]
        .filter(Boolean)
        .join(" "),
      ...searchState.values
    )

    const total = Number.parseInt(countResult[0]?.count ?? "0", 10)

    const payload: SqlRowsResponse = {
      rows: rows.map(serializeRow),
      columns,
      primaryKeys,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      sortBy: orderColumn ?? null,
      sortDirection,
      search,
    }

    return NextResponse.json(payload)
  } catch (error) {
    return handleError(error, "[GET /api/admin/database/rows]")
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, data } = (await req.json()) as {
      table?: string
      data?: Record<string, unknown>
    }

    if (!table || !data) {
      throw new SqlManagerError("Table and row data are required")
    }

    const prisma = getPrismaClient()
    const columns = await getTableColumns(prisma, table)
    const payload = normalizeEditablePayload(data, columns, "insert")

    const entries = Object.entries(payload)
    if (entries.length === 0) {
      throw new SqlManagerError("No writable column values provided")
    }

    const columnSql = entries.map(([key]) => quoteIdentifier(key)).join(", ")
    const valueSql = entries.map((_, index) => `$${index + 1}`).join(", ")
    const values = entries.map(([, value]) => value)

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${valueSql}) RETURNING *`,
      ...values
    )

    return NextResponse.json({
      success: true,
      data: rows.map(serializeRow),
    })
  } catch (error) {
    return handleError(error, "[POST /api/admin/database/rows]")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, data, where } = (await req.json()) as {
      table?: string
      data?: Record<string, unknown>
      where?: Record<string, unknown>
    }

    if (!table || !data || !where) {
      throw new SqlManagerError("Table, row data, and row identity are required")
    }

    const prisma = getPrismaClient()
    const columns = await getTableColumns(prisma, table)
    const primaryKeys = columns.filter((column) => column.isPrimaryKey).map((column) => column.columnName)
    const payload = normalizeEditablePayload(data, columns, "update")
    const entries = Object.entries(payload)

    if (entries.length === 0) {
      throw new SqlManagerError("No editable values provided")
    }

    const setClause = entries
      .map(([key], index) => `${quoteIdentifier(key)} = $${index + 1}`)
      .join(", ")
    const setValues = entries.map(([, value]) => value)
    const whereState = buildPrimaryKeyWhereClause(primaryKeys, where)

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${quoteIdentifier(table)} SET ${setClause} WHERE ${whereState.clause} RETURNING *`,
      ...setValues,
      ...whereState.values
    )

    return NextResponse.json({
      success: true,
      data: rows.map(serializeRow),
    })
  } catch (error) {
    return handleError(error, "[PUT /api/admin/database/rows]")
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, where } = (await req.json()) as {
      table?: string
      where?: Record<string, unknown>
    }

    if (!table || !where) {
      throw new SqlManagerError("Table and row identity are required")
    }

    const prisma = getPrismaClient()
    const columns = await getTableColumns(prisma, table)
    const primaryKeys = columns.filter((column) => column.isPrimaryKey).map((column) => column.columnName)
    const whereState = buildPrimaryKeyWhereClause(primaryKeys, where)

    const deletedRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `DELETE FROM ${quoteIdentifier(table)} WHERE ${whereState.clause} RETURNING *`,
      ...whereState.values
    )

    return NextResponse.json({
      success: true,
      data: deletedRows.map(serializeRow),
    })
  } catch (error) {
    return handleError(error, "[DELETE /api/admin/database/rows]")
  }
}
