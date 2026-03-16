import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import {
  ensureColumnExists,
  ensureSqlManagerAccess,
  ensureTableExists,
  formatDefaultValueSql,
  getTableColumns,
  quoteIdentifier,
  SqlManagerError,
  validateSqlType,
} from "@/features/admin/sql-manager/server-utils"

function handleError(error: unknown, context: string) {
  console.error(context, error)

  if (error instanceof SqlManagerError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json({ error: "Database manager action failed" }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const tableName = req.nextUrl.searchParams.get("table")
    if (!tableName) {
      throw new SqlManagerError("Table name required")
    }

    const prisma = getPrismaClient()
    const columns = await getTableColumns(prisma, tableName)

    return NextResponse.json({
      columns,
      tableName,
      primaryKeys: columns.filter((column) => column.isPrimaryKey).map((column) => column.columnName),
    })
  } catch (error) {
    return handleError(error, "[GET /api/admin/database/columns]")
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const {
      table,
      columnName,
      dataType,
      isNullable,
      defaultValue,
    } = (await req.json()) as {
      table?: string
      columnName?: string
      dataType?: string
      isNullable?: boolean
      defaultValue?: string | null
    }

    if (!table || !columnName || !dataType) {
      throw new SqlManagerError("Table, column name, and data type are required")
    }

    const prisma = getPrismaClient()
    await ensureTableExists(prisma, table)

    const existingColumns = await getTableColumns(prisma, table)
    if (existingColumns.some((column) => column.columnName === columnName)) {
      throw new SqlManagerError(`Column "${columnName}" already exists`, 409)
    }

    const normalizedType = validateSqlType(dataType)
    const defaultSql = formatDefaultValueSql(defaultValue)

    await prisma.$executeRawUnsafe(
      [
        `ALTER TABLE ${quoteIdentifier(table)}`,
        `ADD COLUMN ${quoteIdentifier(columnName)} ${normalizedType}`,
        isNullable ? "" : "NOT NULL",
        defaultSql ? `DEFAULT ${defaultSql}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    )

    return NextResponse.json({
      success: true,
      message: `Added column "${columnName}"`,
    })
  } catch (error) {
    return handleError(error, "[POST /api/admin/database/columns]")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const {
      table,
      columnName,
      nextName,
      dataType,
      isNullable,
      defaultValue,
    } = (await req.json()) as {
      table?: string
      columnName?: string
      nextName?: string
      dataType?: string
      isNullable?: boolean
      defaultValue?: string | null
    }

    if (!table || !columnName || !dataType || typeof isNullable !== "boolean") {
      throw new SqlManagerError("Incomplete column update payload")
    }

    const prisma = getPrismaClient()
    await ensureTableExists(prisma, table)
    await ensureColumnExists(prisma, table, columnName)

    const columns = await getTableColumns(prisma, table)
    const currentColumn = columns.find((column) => column.columnName === columnName)

    if (!currentColumn) {
      throw new SqlManagerError(`Column "${columnName}" not found`, 404)
    }

    if (currentColumn.isPrimaryKey || currentColumn.isIdentity) {
      throw new SqlManagerError("Primary key or identity columns cannot be modified here", 409)
    }

    const normalizedType = validateSqlType(dataType)
    const updatedColumnName = nextName && nextName !== columnName ? nextName : columnName
    const quotedTable = quoteIdentifier(table)

    if (updatedColumnName !== columnName) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE ${quotedTable} RENAME COLUMN ${quoteIdentifier(columnName)} TO ${quoteIdentifier(updatedColumnName)}`
      )
    }

    const activeColumn = quoteIdentifier(updatedColumnName)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quotedTable} ALTER COLUMN ${activeColumn} TYPE ${normalizedType} USING ${activeColumn}::${normalizedType}`
    )

    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quotedTable} ALTER COLUMN ${activeColumn} ${isNullable ? "DROP" : "SET"} NOT NULL`
    )

    const defaultSql = formatDefaultValueSql(defaultValue)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quotedTable} ALTER COLUMN ${activeColumn} ${defaultSql ? `SET DEFAULT ${defaultSql}` : "DROP DEFAULT"}`
    )

    return NextResponse.json({
      success: true,
      message: `Updated column "${updatedColumnName}"`,
    })
  } catch (error) {
    return handleError(error, "[PUT /api/admin/database/columns]")
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, columnName } = (await req.json()) as {
      table?: string
      columnName?: string
    }

    if (!table || !columnName) {
      throw new SqlManagerError("Table and column name are required")
    }

    const prisma = getPrismaClient()
    await ensureTableExists(prisma, table)

    const columns = await getTableColumns(prisma, table)
    const targetColumn = columns.find((column) => column.columnName === columnName)

    if (!targetColumn) {
      throw new SqlManagerError(`Column "${columnName}" not found`, 404)
    }

    if (targetColumn.isPrimaryKey) {
      throw new SqlManagerError("Primary key columns cannot be deleted from SQL Manager", 409)
    }

    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quoteIdentifier(table)} DROP COLUMN ${quoteIdentifier(columnName)}`
    )

    return NextResponse.json({
      success: true,
      message: `Deleted column "${columnName}"`,
    })
  } catch (error) {
    return handleError(error, "[DELETE /api/admin/database/columns]")
  }
}
