import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  createTopupRequest,
  WalletTopupError,
} from "@/features/wallet/services/create-topup-request"
import type { CreateTopupRequestInput } from "@/features/wallet/validations"

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để nạp ví.",
      },
      { status: 401 }
    )
  }

  let payload: CreateTopupRequestInput

  try {
    payload = (await request.json()) as CreateTopupRequestInput
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu nạp ví.",
      },
      { status: 400 }
    )
  }

  try {
    const topupRequest = await createTopupRequest(session.user.id, payload)

    return NextResponse.json(
      {
        success: true,
        topupRequest,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof WalletTopupError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
        },
        { status: error.status }
      )
    }

    return NextResponse.json(
      {
        success: false,
        code: "TOPUP_REQUEST_FAILED",
        message: "Không thể tạo yêu cầu nạp ví.",
      },
      { status: 500 }
    )
  }
}
