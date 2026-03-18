import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import {
  OrderStatus,
  PaymentIntentStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "@prisma/client"
import { getAuthSession } from "@/lib/auth"
import { canManageWallet } from "@/lib/auth/role-helpers"
import { adminWalletTransactionReviewSchema } from "@/features/admin/validations"
import { getPrismaClient } from "@/lib/db/prisma"

interface RouteContext {
  params: Promise<{
    transactionId: string
  }>
}

class AdminWalletReviewError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeMetadata(
  current: Prisma.JsonValue | null | undefined,
  extra: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    ...(isJsonObject(current) ? current : {}),
    ...extra,
  } as Prisma.InputJsonObject
}

function appendAdminNote(existingNote: string | null, nextLine: string) {
  return [existingNote?.trim(), nextLine].filter(Boolean).join("\n\n")
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageWallet(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền review giao dịch ví.",
      },
      { status: 403 }
    )
  }

  const { transactionId } = await params

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc thao tác review giao dịch.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminWalletTransactionReviewSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Thao tác review chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  const action = parsedPayload.data.action

  try {
    const prisma = getPrismaClient()
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
      select: {
        id: true,
        userId: true,
        walletId: true,
        orderId: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        metadata: true,
        wallet: {
          select: {
            id: true,
            status: true,
            currency: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            note: true,
          },
        },
        paymentIntent: {
          select: {
            id: true,
            status: true,
            metadata: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy transaction cần review.",
        },
        { status: 404 }
      )
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          message: "Chỉ có thể review transaction đang ở trạng thái pending.",
        },
        { status: 409 }
      )
    }

    if (![TransactionType.TOPUP, TransactionType.PAYMENT].includes(transaction.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Hiện chỉ hỗ trợ review nhanh cho giao dịch nạp ví hoặc thanh toán đơn hàng.",
        },
        { status: 400 }
      )
    }

    const actorName = session.user.name || session.user.email || "Admin"
    const timestamp = new Date().toLocaleString("vi-VN")
    const reviewMetadata = {
      reviewAction: action,
      reviewedAt: new Date().toISOString(),
      reviewedById: session.user.id,
      reviewedByRole: session.user.role,
      reviewedByLabel: actorName,
      reviewNote: parsedPayload.data.note ?? null,
      reviewChannel: "admin_wallet_page",
    }

    await prisma.$transaction(async (tx) => {
      if (transaction.type === TransactionType.TOPUP) {
        if (!transaction.walletId || !transaction.wallet) {
          throw new AdminWalletReviewError("Giao dịch nạp này không còn gắn với ví hợp lệ.", 409)
        }

        if (transaction.wallet.status === WalletStatus.CLOSED) {
          throw new AdminWalletReviewError("Không thể review nạp tiền cho ví đã đóng.", 400)
        }

        if (transaction.wallet.currency !== transaction.currency) {
          throw new AdminWalletReviewError("Đơn vị tiền tệ của ví và transaction không khớp.", 409)
        }

        if (action === "approve") {
          await tx.wallet.update({
            where: {
              id: transaction.wallet.id,
            },
            data: {
              balance: {
                increment: transaction.amount,
              },
            },
          })
        }

        await tx.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            status:
              action === "approve"
                ? TransactionStatus.COMPLETED
                : action === "reject"
                  ? TransactionStatus.FAILED
                  : TransactionStatus.CANCELLED,
            metadata: mergeMetadata(transaction.metadata, reviewMetadata),
          },
        })

        return
      }

      if (!transaction.orderId || !transaction.order) {
        throw new AdminWalletReviewError("Giao dịch thanh toán này không còn gắn với đơn hàng hợp lệ.", 409)
      }

      const nextTransactionStatus =
        action === "approve"
          ? TransactionStatus.COMPLETED
          : action === "reject"
            ? TransactionStatus.FAILED
            : TransactionStatus.CANCELLED
      const nextOrderStatus =
        action === "approve"
          ? OrderStatus.PROCESSING
          : action === "reject"
            ? OrderStatus.FAILED
            : OrderStatus.CANCELLED
      const nextPaymentIntentStatus =
        action === "approve"
          ? PaymentIntentStatus.SUCCEEDED
          : action === "reject"
            ? PaymentIntentStatus.FAILED
            : PaymentIntentStatus.CANCELED

      await tx.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: nextTransactionStatus,
          metadata: mergeMetadata(transaction.metadata, reviewMetadata),
        },
      })

      await tx.order.update({
        where: {
          id: transaction.order.id,
        },
        data: {
          status: nextOrderStatus,
          paymentStatus: nextTransactionStatus,
          note: appendAdminNote(
            transaction.order.note,
            `[${timestamp}] ${actorName} ${action === "approve" ? "đã duyệt" : action === "reject" ? "đã từ chối" : "đã huỷ"} giao dịch thanh toán${parsedPayload.data.note ? `: ${parsedPayload.data.note}` : "."}`
          ),
        },
      })

      if (transaction.paymentIntent) {
        await tx.paymentIntent.update({
          where: {
            id: transaction.paymentIntent.id,
          },
          data: {
            status: nextPaymentIntentStatus,
            metadata: mergeMetadata(transaction.paymentIntent.metadata, reviewMetadata),
          },
        })
      }
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/wallet")
    revalidatePath("/dashboard/admin/orders")
    revalidatePath("/dashboard/wallet")
    revalidatePath("/dashboard/billing")
    revalidatePath("/dashboard/orders")

    if (transaction.orderId) {
      revalidatePath(`/dashboard/admin/orders/${transaction.orderId}`)
      revalidatePath(`/dashboard/orders/${transaction.orderId}`)
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Đã duyệt giao dịch thành công."
          : action === "reject"
            ? "Đã từ chối giao dịch."
            : "Đã huỷ giao dịch.",
    })
  } catch (error) {
    if (error instanceof AdminWalletReviewError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status }
      )
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Failed to review admin wallet transaction.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể review transaction lúc này.",
      },
      { status: 500 }
    )
  }
}
