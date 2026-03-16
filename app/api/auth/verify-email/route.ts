import { NextResponse } from "next/server"
import { verifyEmailSchema } from "@/features/auth/validations"
import { verifyEmailToken } from "@/features/auth/services/email-verification"

export async function POST(request: Request) {
  let payload: { token?: string }

  try {
    payload = (await request.json()) as { token?: string }
  } catch {
    return NextResponse.json(
      {
        success: false,
        state: "invalid",
        message: "Không thể đọc liên kết xác minh.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = verifyEmailSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        state: "invalid",
        message: parsedPayload.error.issues[0]?.message ?? "Liên kết xác minh không hợp lệ.",
      },
      { status: 400 }
    )
  }

  const result = await verifyEmailToken(parsedPayload.data.token)

  return NextResponse.json(
    {
      success: result.state === "verified" || result.state === "already_verified",
      ...result,
    },
    { status: result.state === "invalid" || result.state === "expired" ? 400 : 200 }
  )
}
