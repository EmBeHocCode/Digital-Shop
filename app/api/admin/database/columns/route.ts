import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const prisma = getPrismaClient()
    const tableName = req.nextUrl.searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 })
    }

    // Get table structure
    const columns = await prisma.$queryRaw<
      Array<{
        column_name: string
        data_type: string
        is_nullable: string
        column_default: string | null
        constraint_type: string | null
      }>
    >`
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu
        ON c.table_name = kcu.table_name
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE c.table_name = ${tableName}
      AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `

    return NextResponse.json({ columns, tableName })
  } catch (error) {
    console.error("[GET /api/admin/database/columns]", error)
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 })
  }
}
