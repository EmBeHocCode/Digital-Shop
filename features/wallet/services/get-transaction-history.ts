import { Prisma, TransactionType } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"
import {
  mapPrismaPaymentMethodToCode,
  mapPrismaPaymentProviderToCode,
  mapTransactionStatusToPaymentIntentStatus,
} from "@/features/payment/utils"
import type { PaymentIntentStatus, PaymentMethodCode, PaymentProviderCode } from "@/features/payment/types"

export interface TransactionHistoryItem {
  id: string
  type: string
  status: string
  paymentStatus: PaymentIntentStatus
  amount: number
  amountLabel: string
  currency: string
  description: string | null
  reference: string | null
  orderId: string | null
  paymentMethod: PaymentMethodCode | null
  paymentProvider: PaymentProviderCode | null
  createdAt: Date
}

const transactionHistorySelect = {
  id: true,
  type: true,
  status: true,
  amount: true,
  currency: true,
  description: true,
  reference: true,
  orderId: true,
  paymentMethod: true,
  paymentProvider: true,
  createdAt: true,
} satisfies Prisma.TransactionSelect

type TransactionRecord = Prisma.TransactionGetPayload<{
  select: typeof transactionHistorySelect
}>

function getAmountPrefix(type: TransactionType) {
  switch (type) {
    case TransactionType.PAYMENT:
      return "-"
    case TransactionType.REFUND:
      return "+"
    case TransactionType.TOPUP:
      return "+"
    case TransactionType.ADJUSTMENT:
      return ""
  }
}

function mapTransaction(transaction: TransactionRecord): TransactionHistoryItem {
  const amount = Number(transaction.amount)

  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    paymentStatus: mapTransactionStatusToPaymentIntentStatus(transaction.status),
    amount,
    amountLabel: `${getAmountPrefix(transaction.type)}${formatCurrency(
      amount,
      transaction.currency
    )}`,
    currency: transaction.currency,
    description: transaction.description,
    reference: transaction.reference,
    orderId: transaction.orderId,
    paymentMethod: mapPrismaPaymentMethodToCode(transaction.paymentMethod),
    paymentProvider: mapPrismaPaymentProviderToCode(transaction.paymentProvider),
    createdAt: transaction.createdAt,
  }
}

export const getTransactionHistory = cache(async (userId: string, take = 20) => {
  if (!userId) {
    return [] as TransactionHistoryItem[]
  }

  try {
    const prisma = getPrismaClient()
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      select: transactionHistorySelect,
    })

    return transactions.map(mapTransaction)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load transaction history.", error)
    }

    return [] as TransactionHistoryItem[]
  }
})
