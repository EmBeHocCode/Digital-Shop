import { Prisma } from "@prisma/client"
import { hashPassword } from "@/lib/auth/password"
import { getPrismaClient } from "@/lib/db/prisma"
import { issueEmailVerification } from "@/features/auth/services/email-verification"
import { registerSchema, type RegisterInput } from "@/features/auth/validations"

export interface RegisterUserSuccess {
  success: true
  userId: string
  email: string
  verificationEmailSent: boolean
}

export interface RegisterUserFailure {
  success: false
  status: 400 | 409 | 500 | 503
  message: string
  field?: "email" | "form"
}

export type RegisterUserResult = RegisterUserSuccess | RegisterUserFailure

function getFirstValidationMessage(error: Prisma.JsonObject | undefined) {
  return error ? "Dữ liệu đăng ký chưa hợp lệ." : null
}

function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false
  }

  const code = String(error.code)

  return ["P1001", "ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT"].includes(code)
}

export async function registerUser(
  input: RegisterInput,
  request?: Request | null
): Promise<RegisterUserResult> {
  const parsedInput = registerSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      status: 400,
      field: "form",
      message:
        parsedInput.error.flatten().formErrors[0] ??
        getFirstValidationMessage(undefined) ??
        "Dữ liệu đăng ký chưa hợp lệ.",
    }
  }

  const prisma = getPrismaClient()
  const email = parsedInput.data.email

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return {
        success: false,
        status: 409,
        field: "email",
        message: "Email này đã được sử dụng.",
      }
    }

    const passwordHash = await hashPassword(parsedInput.data.password)
    const phone =
      parsedInput.data.phone && parsedInput.data.phone.trim().length > 0
        ? parsedInput.data.phone.trim()
        : null

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name: parsedInput.data.name.trim(),
          phone,
          passwordHash,
        },
        select: { id: true },
      })

      await tx.wallet.create({
        data: {
          userId: createdUser.id,
        },
      })

      return createdUser
    })

    let verificationEmailSent = false

    try {
      const verificationDelivery = await issueEmailVerification({
        userId: user.id,
        email,
        name: parsedInput.data.name.trim(),
        request,
      })
      verificationEmailSent = verificationDelivery.delivered
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Verification email dispatch failed", error)
      }
    }

    return {
      success: true,
      userId: user.id,
      email,
      verificationEmailSent,
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        status: 409,
        field: "email",
        message: "Email này đã được sử dụng.",
      }
    }

    if (isDatabaseUnavailableError(error)) {
      return {
        success: false,
        status: 503,
        field: "form",
        message:
          "Database chưa sẵn sàng. Hãy bật PostgreSQL rồi thử đăng ký lại.",
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("User registration failed", error)
    }

    return {
      success: false,
      status: 500,
      field: "form",
      message: "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
    }
  }
}
