import { NextResponse } from "next/server"
import { resendVerificationSchema } from "@/features/auth/validations"
import { resendEmailVerification } from "@/features/auth/services/email-verification"

export async function POST(request: Request) {
  let payload: { email?: string }

  try {
    payload = (await request.json()) as { email?: string }
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu yêu cầu.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = resendVerificationSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Email không hợp lệ.",
      },
      { status: 400 }
    )
  }

  const result = await resendEmailVerification(parsedPayload.data.email, request)

  return NextResponse.json(result, { status: 200 })
}
