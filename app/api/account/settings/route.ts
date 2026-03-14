import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { updateUserSettingsSchema } from "@/features/account/validations"

export async function PATCH(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để cập nhật hồ sơ.",
      },
      { status: 401 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu cập nhật.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = updateUserSettingsSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Thông tin cập nhật chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: parsedPayload.data.name,
        phone: parsedPayload.data.phone || null,
      },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to update account settings.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể lưu hồ sơ lúc này.",
      },
      { status: 500 }
    )
  }
}
