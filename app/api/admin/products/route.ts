import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { canManageProducts } from "@/lib/auth/role-helpers"
import { adminCreateProductSchema } from "@/features/admin/validations"

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageProducts(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền tạo sản phẩm.",
      },
      { status: 403 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu sản phẩm.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminCreateProductSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Dữ liệu sản phẩm chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: parsedPayload.data.slug,
      },
      select: {
        id: true,
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Slug sản phẩm đã tồn tại.",
        },
        { status: 409 }
      )
    }

    const product = await prisma.product.create({
      data: {
        slug: parsedPayload.data.slug,
        name: parsedPayload.data.name,
        tagline: parsedPayload.data.tagline || null,
        description: parsedPayload.data.description || null,
        price: parsedPayload.data.price,
        priceLabel: parsedPayload.data.priceLabel || null,
        currency: parsedPayload.data.currency.toUpperCase(),
        domain: parsedPayload.data.domain,
        category: parsedPayload.data.category,
        status: parsedPayload.data.status,
        imageUrl: parsedPayload.data.imageUrl || null,
        isFeatured: parsedPayload.data.isFeatured,
        sortOrder: parsedPayload.data.sortOrder,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    revalidatePath("/services")
    revalidatePath(`/services/${product.slug}`)
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/products")

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    )
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to create product from admin route.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tạo sản phẩm lúc này.",
      },
      { status: 500 }
    )
  }
}
