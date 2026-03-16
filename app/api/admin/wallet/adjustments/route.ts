import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { PaymentMethod, PaymentProvider, TransactionStatus, TransactionType } from "@prisma/client"
import { getAuthSession } from "@/lib/auth"
import { getPrismaClient } from "@/lib/db/prisma"
import { canManageWallet } from "@/lib/auth/role-helpers"
import { adminWalletAdjustmentSchema } from "@/features/admin/validations"

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id || !canManageWallet(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn không có quyền điều chỉnh ví.",
      },
      { status: 403 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể đọc dữ liệu điều chỉnh ví.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = adminWalletAdjustmentSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsedPayload.error.issues[0]?.message ?? "Dữ liệu điều chỉnh ví chưa hợp lệ.",
      },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: parsedPayload.data.walletId,
      },
      select: {
        id: true,
        userId: true,
        balance: true,
        status: true,
      },
    })

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy ví cần điều chỉnh.",
        },
        { status: 404 }
      )
    }

    if (wallet.status === "CLOSED") {
      return NextResponse.json(
        {
          success: false,
          message: "Không thể điều chỉnh ví đã đóng.",
        },
        { status: 400 }
      )
    }

    const nextBalance = Number(wallet.balance) + parsedPayload.data.amount

    if (nextBalance < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Điều chỉnh này sẽ làm số dư âm. Hãy kiểm tra lại.",
        },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: parsedPayload.data.amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: wallet.userId,
          walletId: wallet.id,
          type: TransactionType.ADJUSTMENT,
          paymentMethod: PaymentMethod.MANUAL_CONFIRMATION,
          paymentProvider: PaymentProvider.MANUAL_REVIEW,
          status: TransactionStatus.COMPLETED,
          amount: parsedPayload.data.amount,
          description: parsedPayload.data.description,
          reference: `adj_${Date.now()}`,
          metadata: {
            source: "admin_wallet_adjustment",
            actorId: session.user.id,
            actorRole: session.user.role,
          },
        },
      }),
    ])

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/admin/wallet")
    revalidatePath("/dashboard/wallet")

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to adjust wallet from admin route.", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể điều chỉnh ví lúc này.",
      },
      { status: 500 }
    )
  }
}
