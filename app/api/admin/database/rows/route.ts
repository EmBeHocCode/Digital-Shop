import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { NextRequest, NextResponse } from "next/server"

interface RowQueryParams {
  table?: string
  limit?: string
  offset?: string
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const prisma = getPrismaClient()
    const params = Object.fromEntries(req.nextUrl.searchParams) as RowQueryParams
    const tableName = params.table
    const limit = Math.min(parseInt(params.limit || "100"), 1000)
    const offset = parseInt(params.offset || "0")

    if (!tableName) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 })
    }

    // Get rows with pagination
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`
    )

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    )
    const total = parseInt((countResult[0]?.count as string) || "0")

    return NextResponse.json({
      rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error("[GET /api/admin/database/rows]", error)
    return NextResponse.json({ error: "Failed to fetch rows" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { table, data } = await req.json()

    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Build INSERT statement
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ")

    const query = `
      INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await prisma.$queryRawUnsafe(query, ...values)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[POST /api/admin/database/rows]", error)
    return NextResponse.json({ error: "Failed to insert row" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { table, data, where } = await req.json()

    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Build UPDATE statement
    const setClause = Object.keys(data)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(", ")

    const whereValues = Object.values(where)
    const whereClause = Object.keys(where)
      .map((key, i) => `"${key}" = $${Object.keys(data).length + i + 1}`)
      .join(" AND ")

    const query = `
      UPDATE "${table}"
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `

    const allValues = [...Object.values(data), ...whereValues]
    const result = await prisma.$queryRawUnsafe(query, ...allValues)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[PUT /api/admin/database/rows]", error)
    return NextResponse.json({ error: "Failed to update row" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { table, where } = await req.json()

    if (!table) {
      return NextResponse.json({ error: "Table name required" }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Build DELETE statement
    const whereValues = Object.values(where)
    const whereClause = Object.keys(where)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(" AND ")

    const query = `DELETE FROM "${table}" WHERE ${whereClause}`

    await prisma.$queryRawUnsafe(query, ...whereValues)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/database/rows]", error)
    return NextResponse.json({ error: "Failed to delete row" }, { status: 500 })
  }
}
