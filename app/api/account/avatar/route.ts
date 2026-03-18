import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { avatarUploadConstraints } from "@/features/account/avatar-constants"
import {
  isSupportedAvatarMimeType,
  removeManagedAvatar,
  saveUserAvatar,
} from "@/features/account/avatar-storage"

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để cập nhật ảnh đại diện.",
      },
      { status: 401 }
    )
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu tải lên.",
      },
      { status: 400 }
    )
  }

  const avatar = formData.get("avatar")

  if (!(avatar instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần chọn một ảnh hợp lệ.",
      },
      { status: 400 }
    )
  }

  if (!isSupportedAvatarMimeType(avatar.type)) {
    return NextResponse.json(
      {
        success: false,
        message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.",
      },
      { status: 400 }
    )
  }

  if (avatar.size > avatarUploadConstraints.maxBytes) {
    return NextResponse.json(
      {
        success: false,
        message: `Ảnh đại diện phải nhỏ hơn ${avatarUploadConstraints.maxBytesLabel}.`,
      },
      { status: 400 }
    )
  }

  let uploadedImageUrl: string | null = null

  try {
    const prisma = getPrismaClient()
    const existingUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        image: true,
      },
    })

    uploadedImageUrl = await saveUserAvatar(session.user.id, avatar)

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: uploadedImageUrl,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    })

    if (existingUser?.image && existingUser.image !== user.image) {
      await removeManagedAvatar(existingUser.image)
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    if (uploadedImageUrl) {
      await removeManagedAvatar(uploadedImageUrl).catch(() => undefined)
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Failed to upload avatar.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể tải ảnh đại diện lúc này.",
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để cập nhật ảnh đại diện.",
      },
      { status: 401 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const existingUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        image: true,
      },
    })

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        image: null,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    })

    await removeManagedAvatar(existingUser?.image)

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to remove avatar.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể gỡ ảnh đại diện lúc này.",
      },
      { status: 500 }
    )
  }
}
