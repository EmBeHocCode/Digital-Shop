import { NextResponse } from "next/server"
import { registerUser } from "@/features/auth/actions/register-user"
import type { RegisterInput } from "@/features/auth/validations"

export async function POST(request: Request) {
  let payload: RegisterInput

  try {
    payload = (await request.json()) as RegisterInput
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu đăng ký.",
        field: "form",
      },
      { status: 400 }
    )
  }

  const result = await registerUser(payload, request)

  if (!result.success) {
    return NextResponse.json(result, { status: result.status })
  }

  return NextResponse.json(
    {
      success: true,
      userId: result.userId,
      email: result.email,
      verificationEmailSent: result.verificationEmailSent,
    },
    { status: 201 }
  )
}
