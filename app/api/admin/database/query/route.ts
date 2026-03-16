import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { ensureSqlManagerAccess, SqlManagerError } from "@/features/admin/sql-manager/server-utils"
import type { SqlQueryResult } from "@/features/admin/sql-manager/types"

function getErrorMessage(error: unknown) {
  if (error instanceof SqlManagerError) {
    return {
      message: error.message,
      status: error.status,
    }
  }

  return {
    message: error instanceof Error ? error.message : "Query execution failed",
    status: 500,
  }
}

function inferQueryMode(query: string): "read" | "write" {
  return /^\s*select\b/i.test(query) ? "read" : "write"
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    ensureSqlManagerAccess(session)

    const { query } = (await req.json()) as { query?: string }
    if (!query?.trim()) {
      throw new SqlManagerError("Query required")
    }

    const upperQuery = query.toUpperCase().trim()
    if (upperQuery.startsWith("TRUNCATE")) {
      throw new SqlManagerError("TRUNCATE is blocked in SQL Manager", 403)
    }

    const prisma = getPrismaClient()
    const executionMode = inferQueryMode(query)

    if (executionMode === "read") {
      const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query)
      const payload: SqlQueryResult = {
        rows: result,
        columns: result[0] ? Object.keys(result[0]) : [],
        executionMode,
        affectedRows: result.length,
      }

      return NextResponse.json({ success: true, data: payload })
    }

    const affectedRows = await prisma.$executeRawUnsafe(query)
    const payload: SqlQueryResult = {
      rows: [],
      columns: [],
      executionMode,
      affectedRows,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error("[POST /api/admin/database/query]", error)
    const detail = getErrorMessage(error)
    return NextResponse.json({ error: detail.message }, { status: detail.status })
  }
}
