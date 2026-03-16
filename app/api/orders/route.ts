import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import {
  createUserOrder,
  OrderCreationError,
} from "@/features/orders/services/create-user-order"
import { getUserOrders } from "@/features/orders/services/get-user-orders"
import type { CreateOrderInput } from "@/features/orders/validations"

export async function GET() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để xem đơn hàng.",
      },
      { status: 401 }
    )
  }

  const orders = await getUserOrders(session.user.id)

  return NextResponse.json({
    success: true,
    orders,
  })
}

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để tạo đơn hàng.",
      },
      { status: 401 }
    )
  }

  let payload: CreateOrderInput

  try {
    payload = (await request.json()) as CreateOrderInput
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu checkout.",
      },
      { status: 400 }
    )
  }

  try {
    const result = await createUserOrder(session.user.id, payload, request)

    return NextResponse.json(
      {
        success: true,
        order: result.order,
        payment: result.payment,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof OrderCreationError) {
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
        code: "ORDER_CREATION_FAILED",
        message: "Không thể tạo đơn hàng lúc này.",
      },
      { status: 500 }
    )
  }
}
