import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import {
  ensureSqlManagerAccess,
  ensureTableExists,
  getTableSummaries,
  quoteIdentifier,
  SqlManagerError,
} from "@/features/admin/sql-manager/server-utils"

function handleError(error: unknown, context: string) {
  console.error(context, error)

  if (error instanceof SqlManagerError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json({ error: "Database manager action failed" }, { status: 500 })
}

export async function GET() {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const prisma = getPrismaClient()
    const tables = await getTableSummaries(prisma)

    return NextResponse.json({ tables, schema: "public" })
  } catch (error) {
    return handleError(error, "[GET /api/admin/database/tables]")
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { name } = (await req.json()) as { name?: string }
    if (!name) {
      throw new SqlManagerError("Table name required")
    }

    const prisma = getPrismaClient()
    const quotedTable = quoteIdentifier(name)

    const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${name}
      ) AS "exists"
    `

    if (existing[0]?.exists) {
      throw new SqlManagerError(`Table "${name}" already exists`, 409)
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE ${quotedTable} (
        "id" BIGSERIAL PRIMARY KEY,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    return NextResponse.json({
      success: true,
      message: `Created table "${name}"`,
    })
  } catch (error) {
    return handleError(error, "[POST /api/admin/database/tables]")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, nextName } = (await req.json()) as {
      table?: string
      nextName?: string
    }

    if (!table || !nextName) {
      throw new SqlManagerError("Current table name and next name are required")
    }

    const prisma = getPrismaClient()
    await ensureTableExists(prisma, table)

    const targetExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${nextName}
      ) AS "exists"
    `

    if (targetExists[0]?.exists) {
      throw new SqlManagerError(`Table "${nextName}" already exists`, 409)
    }

    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${quoteIdentifier(table)} RENAME TO ${quoteIdentifier(nextName)}`
    )

    return NextResponse.json({
      success: true,
      message: `Renamed "${table}" to "${nextName}"`,
    })
  } catch (error) {
    return handleError(error, "[PUT /api/admin/database/tables]")
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { table, cascade } = (await req.json()) as {
      table?: string
      cascade?: boolean
    }

    if (!table) {
      throw new SqlManagerError("Table name required")
    }

    const prisma = getPrismaClient()
    await ensureTableExists(prisma, table)

    await prisma.$executeRawUnsafe(
      `DROP TABLE ${quoteIdentifier(table)}${cascade ? " CASCADE" : ""}`
    )

    return NextResponse.json({
      success: true,
      message: `Dropped table "${table}"`,
    })
  } catch (error) {
    return handleError(error, "[DELETE /api/admin/database/tables]")
  }
}
