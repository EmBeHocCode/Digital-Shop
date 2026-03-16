import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { canManageUsers, hasHigherOrEqualPrivilege } from "@/lib/auth/role-helpers"
import { adminUserUpdateSchema } from "@/features/admin/validations"

interface RouteContext {
  params: Promise<{
    userId: string
  }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageUsers(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền quản lý người dùng.",
      },
      { status: 403 }
    )
  }

  const { userId } = await params

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu cập nhật người dùng.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminUserUpdateSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Cập nhật người dùng chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  if (session.user.id === userId) {
    return NextResponse.json(
      {
        success: false,
        message: "Không chỉnh sửa role hoặc trạng thái của chính bạn tại đây.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy người dùng.",
        },
        { status: 404 }
      )
    }

    if (
      targetUser.role === "SUPERADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Chỉ superadmin mới quản lý được tài khoản superadmin.",
        },
        { status: 403 }
      )
    }

    if (
      parsedPayload.data.role === "SUPERADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Chỉ superadmin mới có thể gán role superadmin.",
        },
        { status: 403 }
      )
    }

    if (
      parsedPayload.data.role &&
      !hasHigherOrEqualPrivilege(session.user.role, parsedPayload.data.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Role mục tiêu cao hơn quyền hiện tại của bạn.",
        },
        { status: 403 }
      )
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(parsedPayload.data.role ? { role: parsedPayload.data.role } : {}),
        ...(parsedPayload.data.isActive !== undefined
          ? { isActive: parsedPayload.data.isActive }
          : {}),
      },
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/users")
    revalidatePath(`/dashboard/admin/users/${userId}`)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to update user from admin route.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật người dùng lúc này.",
      },
      { status: 500 }
    )
  }
}
