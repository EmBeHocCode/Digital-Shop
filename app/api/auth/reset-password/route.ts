import { NextResponse } from "next/server"
import { resetPasswordSchema } from "@/features/auth/validations"
import { resetPasswordWithToken } from "@/features/auth/services/password-reset"

export async function POST(request: Request) {
  let payload: { token?: string; password?: string; confirmPassword?: string }

  try {
    payload = (await request.json()) as {
      token?: string
      password?: string
      confirmPassword?: string
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu yêu cầu.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = resetPasswordSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Dữ liệu đặt lại mật khẩu chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  const result = await resetPasswordWithToken(
    parsedPayload.data.token,
    parsedPayload.data.password
  )

  return NextResponse.json(result, { status: result.status })
}
