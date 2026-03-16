import { SecurityEventType } from "@prisma/client"
import { buildAppUrl } from "@/lib/app-url"
import { buildEmailVerificationMail } from "@/lib/mail/templates"
import { sendTransactionalMail } from "@/lib/mail/mailer"
import { getPrismaClient } from "@/lib/db/prisma"
import { createExpiryDate, createOpaqueToken, hashOpaqueToken } from "@/features/auth/services/token-helpers"

const EMAIL_VERIFICATION_TTL_HOURS = 24

export interface EmailVerificationDeliveryResult {
  delivered: boolean
}

export async function issueEmailVerification(input: {
  userId: string
  email: string
  name?: string | null
  request?: Request | null
}): Promise<EmailVerificationDeliveryResult> {
  const prisma = getPrismaClient()
  const rawToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(rawToken)
  const expiresAt = createExpiryDate(EMAIL_VERIFICATION_TTL_HOURS)

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.updateMany({
      where: {
        userId: input.userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await tx.emailVerificationToken.create({
      data: {
        userId: input.userId,
        tokenHash,
        expiresAt,
      },
    })
  })

  const verificationUrl = buildAppUrl(
    `/verify-email?token=${encodeURIComponent(rawToken)}`,
    input.request ?? null
  )
  const message = buildEmailVerificationMail({
    name: input.name,
    verificationUrl,
  })

  return sendTransactionalMail({
    to: input.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}

export async function verifyEmailToken(rawToken: string) {
  const token = rawToken.trim()

  if (!token) {
    return {
      state: "invalid" as const,
    }
  }

  const prisma = getPrismaClient()
  const tokenHash = hashOpaqueToken(token)
  const record = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  })

  if (!record) {
    return {
      state: "invalid" as const,
    }
  }

  if (record.usedAt || record.user.emailVerified) {
    return {
      state: "already_verified" as const,
      email: record.user.email,
    }
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return {
      state: "expired" as const,
      email: record.user.email,
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await tx.user.update({
      where: {
        id: record.user.id,
      },
      data: {
        emailVerified: new Date(),
      },
    })

    await tx.securityEvent.create({
      data: {
        userId: record.user.id,
        type: SecurityEventType.REGISTER,
        metadata: {
          source: "email_verification",
        },
      },
    })
  })

  return {
    state: "verified" as const,
    email: record.user.email,
  }
}

export async function resendEmailVerification(email: string, request?: Request | null) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return {
      success: false,
      message: "Email không hợp lệ.",
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
      emailVerified: true,
    },
  })

  if (!user) {
    return {
      success: true,
      message: "Nếu email tồn tại, chúng tôi sẽ gửi lại liên kết xác minh.",
    }
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: "Email này đã được xác minh.",
    }
  }

  let delivered = false

  try {
    const delivery = await issueEmailVerification({
      userId: user.id,
      email: user.email,
      name: user.name,
      request,
    })
    delivered = delivery.delivered
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Resend verification email failed", error)
    }
  }

  return {
    success: true,
    message: delivered
      ? "Liên kết xác minh đã được gửi lại."
      : "Tài khoản đã được tạo nhưng email chưa thể gửi tự động. Hãy kiểm tra cấu hình SMTP hoặc thử lại sau.",
  }
}
