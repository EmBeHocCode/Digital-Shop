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

export interface WalletTransactionSummary {
  id: string
  type: string
  status: string
  paymentStatus: PaymentIntentStatus
  amount: number
  amountLabel: string
  description: string | null
  reference: string | null
  paymentMethod: PaymentMethodCode | null
  paymentProvider: PaymentProviderCode | null
  createdAt: Date
}

export interface WalletSummary {
  hasWallet: boolean
  id: string | null
  balance: number
  balanceLabel: string
  currency: string
  status: string | null
  transactionCount: number
  recentTransactions: WalletTransactionSummary[]
}

const walletSelect = {
  id: true,
  balance: true,
  currency: true,
  status: true,
  transactions: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      description: true,
      reference: true,
      paymentMethod: true,
      paymentProvider: true,
      createdAt: true,
    },
  },
} satisfies Prisma.WalletSelect

type WalletRecord = Prisma.WalletGetPayload<{
  select: typeof walletSelect
}>

function formatTransactionAmount(amount: number, currency: string, type: TransactionType) {
  const prefix = type === TransactionType.PAYMENT ? "-" : "+"

  return `${prefix}${formatCurrency(amount, currency)}`
}

function getEmptyWalletSummary(): WalletSummary {
  return {
    hasWallet: false,
    id: null,
    balance: 0,
    balanceLabel: formatCurrency(0),
    currency: "VND",
    status: null,
    transactionCount: 0,
    recentTransactions: [],
  }
}

function mapWallet(record: WalletRecord, transactionCount: number): WalletSummary {
  return {
    hasWallet: true,
    id: record.id,
    balance: Number(record.balance),
    balanceLabel: formatCurrency(Number(record.balance), record.currency),
    currency: record.currency,
    status: record.status,
    transactionCount,
    recentTransactions: record.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      paymentStatus: mapTransactionStatusToPaymentIntentStatus(transaction.status),
      amount: Number(transaction.amount),
      amountLabel: formatTransactionAmount(
        Number(transaction.amount),
        transaction.currency,
        transaction.type
      ),
      description: transaction.description,
      reference: transaction.reference,
      paymentMethod: mapPrismaPaymentMethodToCode(transaction.paymentMethod),
      paymentProvider: mapPrismaPaymentProviderToCode(transaction.paymentProvider),
      createdAt: transaction.createdAt,
    })),
  }
}

export const getWalletSummary = cache(async (userId: string) => {
  if (!userId) {
    return getEmptyWalletSummary()
  }

  try {
    const prisma = getPrismaClient()
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: walletSelect,
    })

    if (!wallet) {
      return getEmptyWalletSummary()
    }

    const transactionCount = await prisma.transaction.count({
      where: {
        walletId: wallet.id,
      },
    })

    return mapWallet(wallet, transactionCount)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load wallet summary.", error)
    }

    return getEmptyWalletSummary()
  }
})
