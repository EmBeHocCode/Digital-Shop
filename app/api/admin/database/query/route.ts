import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Query execution failed"
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { query } = await req.json()

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    // Sanitize query - prevent dangerous operations
    const upperQuery = query.toUpperCase().trim()
    if (
      upperQuery.startsWith("DROP") ||
      upperQuery.startsWith("TRUNCATE") ||
      upperQuery.startsWith("ALTER") ||
      upperQuery.startsWith("CREATE")
    ) {
      return NextResponse.json(
        { error: "DDL operations not allowed via query endpoint" },
        { status: 403 }
      )
    }

    const prisma = getPrismaClient()
    const result = await prisma.$queryRawUnsafe(query)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[POST /api/admin/database/query]", error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
