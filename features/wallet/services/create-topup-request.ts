import { randomUUID } from "node:crypto"
import {
  Prisma,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import {
  createTopupRequestSchema,
  type CreateTopupRequestInput,
} from "@/features/wallet/validations"
import { getTopupPaymentPlan } from "@/features/payment/services/prepare-payment"
import type { PaymentIntentStatus, TopupChannelCode } from "@/features/payment/types"
import {
  mapPaymentMethodCodeToPrisma,
  mapPaymentProviderCodeToPrisma,
} from "@/features/payment/utils"
import { getTopupChannelLabel } from "@/features/payment/services/sepay-topup"

export class WalletTopupError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_INPUT"
      | "WALLET_UNAVAILABLE"
      | "TOPUP_REQUEST_FAILED",
    readonly status: number
  ) {
    super(message)
  }
}

export interface CreatedTopupRequest {
  id: string
  reference: string
  amount: number
  currency: string
  paymentMethod: "bank_transfer" | "manual_confirmation"
  paymentChannel: TopupChannelCode
  paymentProvider: "manual_bank_transfer" | "manual_review"
  paymentStatus: PaymentIntentStatus
  instructions: {
    title: string
    lines: string[]
  }
  createdAt: string
}

function createTopupReference() {
  return `NC-TOPUP-${randomUUID().slice(0, 8).toUpperCase()}`
}

export async function createTopupRequest(userId: string, rawInput: CreateTopupRequestInput) {
  if (!userId) {
    throw new WalletTopupError("Bạn cần đăng nhập để tạo yêu cầu nạp ví.", "INVALID_INPUT", 401)
  }

  const parsedInput = createTopupRequestSchema.safeParse(rawInput)

  if (!parsedInput.success) {
    throw new WalletTopupError(
      parsedInput.error.issues[0]?.message ?? "Dữ liệu nạp ví chưa hợp lệ.",
      "INVALID_INPUT",
      400
    )
  }

  const payload = parsedInput.data
  const prisma = getPrismaClient()

  try {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: {
          userId,
        },
        update: {},
        create: {
          userId,
        },
      })

      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new WalletTopupError("Ví hiện không khả dụng.", "WALLET_UNAVAILABLE", 409)
      }

      const reference = createTopupReference()
      const paymentPlan = getTopupPaymentPlan(
        payload.paymentMethod,
        reference,
        payload.paymentChannel
      )

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: TransactionType.TOPUP,
          paymentMethod: mapPaymentMethodCodeToPrisma(payload.paymentMethod),
          paymentProvider: mapPaymentProviderCodeToPrisma(paymentPlan.provider),
          status: TransactionStatus.PENDING,
          amount: new Prisma.Decimal(payload.amount),
          currency: wallet.currency,
          description: payload.note || `Yêu cầu nạp ví ${reference}`,
          reference,
          metadata: {
            note: payload.note || null,
            paymentChannel: payload.paymentChannel,
            paymentChannelLabel: getTopupChannelLabel(paymentPlan.channel),
          },
        },
        select: {
          id: true,
          createdAt: true,
        },
      })

      return {
        id: transaction.id,
        reference,
        amount: payload.amount,
        currency: wallet.currency,
        paymentMethod: payload.paymentMethod,
        paymentChannel: paymentPlan.channel,
        paymentProvider: paymentPlan.provider,
        paymentStatus: paymentPlan.paymentStatus,
        instructions: paymentPlan.instructions,
        createdAt: transaction.createdAt.toISOString(),
      } satisfies CreatedTopupRequest
    })
  } catch (error) {
    if (error instanceof WalletTopupError) {
      throw error
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Topup request creation failed.", error)
    }

    throw new WalletTopupError(
      "Không thể tạo yêu cầu nạp ví lúc này.",
      "TOPUP_REQUEST_FAILED",
      500
    )
  }
}
