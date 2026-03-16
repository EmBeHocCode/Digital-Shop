import { SecurityEventType } from "@prisma/client"
import { buildAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db/prisma"
import { sendTransactionalMail } from "@/lib/mail/mailer"
import { buildPasswordResetMail } from "@/lib/mail/templates"
import { hashPassword } from "@/lib/auth/password"
import { createExpiryDate, createOpaqueToken, hashOpaqueToken } from "@/features/auth/services/token-helpers"

const PASSWORD_RESET_TTL_HOURS = 2

export async function issuePasswordReset(email: string, request?: Request | null) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return {
      success: true,
      message: "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.",
    }
  }

  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      emailVerified: true,
    },
  })

  if (!user || !user.isActive || !user.emailVerified) {
    return {
      success: true,
      message: "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.",
    }
  }

  const rawToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(rawToken)
  const expiresAt = createExpiryDate(PASSWORD_RESET_TTL_HOURS)

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })
  })

  const resetUrl = buildAppUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`, request ?? null)
  const message = buildPasswordResetMail({
    name: user.name,
    resetUrl,
  })

  let delivered = false

  try {
    const delivery = await sendTransactionalMail({
      to: user.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    delivered = delivery.delivered
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Password reset email dispatch failed", error)
    }
  }

  return {
    success: true,
    message: delivered
      ? "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."
      : "Liên kết đặt lại mật khẩu chưa thể gửi tự động. Hãy kiểm tra cấu hình SMTP hoặc thử lại sau.",
  }
}

export async function resetPasswordWithToken(rawToken: string, nextPassword: string) {
  const token = rawToken.trim()

  if (!token) {
    return {
      success: false as const,
      status: 400,
      message: "Liên kết đặt lại mật khẩu không hợp lệ.",
    }
  }

  const prisma = getPrismaClient()
  const tokenHash = hashOpaqueToken(token)
  const record = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      },
    },
  })

  if (!record || record.usedAt || !record.user.isActive) {
    return {
      success: false as const,
      status: 400,
      message: "Liên kết đặt lại mật khẩu không còn hợp lệ.",
    }
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return {
      success: false as const,
      status: 400,
      message: "Liên kết đặt lại mật khẩu đã hết hạn.",
    }
  }

  const passwordHash = await hashPassword(nextPassword)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: record.user.id,
      },
      data: {
        passwordHash,
      },
    })

    await tx.passwordResetToken.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await tx.passwordResetToken.updateMany({
      where: {
        userId: record.user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await tx.securityEvent.create({
      data: {
        userId: record.user.id,
        type: SecurityEventType.PASSWORD_RESET,
        metadata: {
          source: "self_service_reset",
        },
      },
    })
  })

  return {
    success: true as const,
    status: 200,
    message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại ngay bây giờ.",
  }
}
