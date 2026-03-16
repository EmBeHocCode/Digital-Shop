import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { canManageProducts } from "@/lib/auth/role-helpers"
import { adminUpdateProductSchema } from "@/features/admin/validations"

interface RouteContext {
  params: Promise<{
    productId: string
  }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageProducts(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền cập nhật sản phẩm.",
      },
      { status: 403 }
    )
  }

  const { productId } = await params

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu chỉnh sửa sản phẩm.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminUpdateProductSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Dữ liệu chỉnh sửa chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy sản phẩm cần cập nhật.",
        },
        { status: 404 }
      )
    }

    if (
      parsedPayload.data.slug &&
      parsedPayload.data.slug !== existingProduct.slug
    ) {
      const slugConflict = await prisma.product.findUnique({
        where: {
          slug: parsedPayload.data.slug,
        },
        select: {
          id: true,
        },
      })

      if (slugConflict) {
        return NextResponse.json(
          {
            success: false,
            message: "Slug sản phẩm đã tồn tại.",
          },
          { status: 409 }
        )
      }
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        ...(parsedPayload.data.slug ? { slug: parsedPayload.data.slug } : {}),
        ...(parsedPayload.data.name ? { name: parsedPayload.data.name } : {}),
        ...(parsedPayload.data.tagline !== undefined
          ? { tagline: parsedPayload.data.tagline || null }
          : {}),
        ...(parsedPayload.data.description !== undefined
          ? { description: parsedPayload.data.description || null }
          : {}),
        ...(parsedPayload.data.price !== undefined ? { price: parsedPayload.data.price } : {}),
        ...(parsedPayload.data.priceLabel !== undefined
          ? { priceLabel: parsedPayload.data.priceLabel || null }
          : {}),
        ...(parsedPayload.data.currency
          ? { currency: parsedPayload.data.currency.toUpperCase() }
          : {}),
        ...(parsedPayload.data.domain ? { domain: parsedPayload.data.domain } : {}),
        ...(parsedPayload.data.category ? { category: parsedPayload.data.category } : {}),
        ...(parsedPayload.data.status ? { status: parsedPayload.data.status } : {}),
        ...(parsedPayload.data.imageUrl !== undefined
          ? { imageUrl: parsedPayload.data.imageUrl || null }
          : {}),
        ...(parsedPayload.data.isFeatured !== undefined
          ? { isFeatured: parsedPayload.data.isFeatured }
          : {}),
        ...(parsedPayload.data.sortOrder !== undefined
          ? { sortOrder: parsedPayload.data.sortOrder }
          : {}),
      },
      select: {
        slug: true,
      },
    })

    revalidatePath("/services")
    revalidatePath(`/services/${existingProduct.slug}`)
    revalidatePath(`/services/${product.slug}`)
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/products")

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to update product from admin route.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật sản phẩm lúc này.",
      },
      { status: 500 }
    )
  }
}
