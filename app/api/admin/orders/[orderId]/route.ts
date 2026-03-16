import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { TransactionStatus, TransactionType } from "@prisma/client"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { canManageOrders } from "@/lib/auth/role-helpers"
import { adminOrderActionSchema } from "@/features/admin/validations"

interface RouteContext {
  params: Promise<{
    orderId: string
  }>
}

function appendAdminNote(existingNote: string | null, nextLine: string) {
  return [existingNote?.trim(), nextLine].filter(Boolean).join("\n\n")
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageOrders(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền quản lý đơn hàng.",
      },
      { status: 403 }
    )
  }

  const { orderId } = await params

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc thao tác admin.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminOrderActionSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Dữ liệu thao tác chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
        note: true,
        transactions: {
          where: {
            type: TransactionType.PAYMENT,
            status: TransactionStatus.COMPLETED,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            amount: true,
          },
        },
        refundRequests: {
          where: {
            status: {
              in: ["REQUESTED", "APPROVED", "COMPLETED"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy đơn hàng.",
        },
        { status: 404 }
      )
    }

    const actorName = session.user.name || session.user.email || "Admin"
    const timestamp = new Date().toLocaleString("vi-VN")
    const action = parsedPayload.data

    if (action.action === "mark-reviewed") {
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          note: appendAdminNote(
            order.note,
            `[${timestamp}] Reviewed by ${actorName}${action.note ? `: ${action.note}` : ""}`
          ),
        },
      })
    }

    if (action.action === "set-status") {
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: action.status,
          ...(action.paymentStatus ? { paymentStatus: action.paymentStatus } : {}),
          ...(action.note
            ? {
                note: appendAdminNote(
                  order.note,
                  `[${timestamp}] ${actorName}: ${action.note}`
                ),
              }
            : {}),
        },
      })
    }

    if (action.action === "request-refund") {
      if (order.paymentStatus !== TransactionStatus.COMPLETED) {
        return NextResponse.json(
          {
            success: false,
            message: "Chỉ tạo refund request khi thanh toán đã completed.",
          },
          { status: 400 }
        )
      }

      if (order.refundRequests.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Đơn hàng này đã có refund request đang hoạt động.",
          },
          { status: 409 }
        )
      }

      const latestPayment = order.transactions[0]
      const refundAmount = action.amount ?? Number(latestPayment?.amount ?? order.totalAmount)

      await prisma.$transaction([
        prisma.refundRequest.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            transactionId: latestPayment?.id,
            amount: refundAmount,
            currency: order.currency,
            reason: action.reason,
            note: `Created by ${actorName} on ${timestamp}`,
          },
        }),
        prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            note: appendAdminNote(
              order.note,
              `[${timestamp}] Refund request created by ${actorName}`
            ),
          },
        }),
      ])
    }

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/orders")
    revalidatePath(`/dashboard/admin/orders/${orderId}`)
    revalidatePath("/dashboard/orders")

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to update order from admin route.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật đơn hàng lúc này.",
      },
      { status: 500 }
    )
  }
}
