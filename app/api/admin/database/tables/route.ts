import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const prisma = getPrismaClient()

    // Get all tables from information_schema
    const result = await prisma.$queryRaw<
      Array<{
        tablename: string
      }>
    >`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    // Get row counts for each table
    const tables = await Promise.all(
      result.map(async (t) => {
        try {
          const countResult = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
            `SELECT COUNT(*) as count FROM "${t.tablename}"`
          )
          return {
            name: t.tablename,
            rowCount: parseInt(countResult[0]?.count || "0"),
          }
        } catch {
          return {
            name: t.tablename,
            rowCount: 0,
          }
        }
      })
    )

    return NextResponse.json({ tables, schema: "public" })
  } catch (error) {
    console.error("[GET /api/admin/database/tables]", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}
