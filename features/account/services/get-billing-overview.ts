import { Prisma, TransactionStatus, TransactionType } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface BillingActivityItem {
  id: string
  type: string
  status: string
  amount: number
  amountLabel: string
  description: string | null
  createdAt: Date
}

export interface BillingOverview {
  currency: string
  walletBalance: number
  walletBalanceLabel: string
  totalSpent: number
  totalSpentLabel: string
  totalTopups: number
  totalTopupsLabel: string
  successfulPayments: number
  pendingTransactions: number
  recentActivity: BillingActivityItem[]
}

const recentBillingActivitySelect = {
  id: true,
  type: true,
  status: true,
  amount: true,
  currency: true,
  description: true,
  createdAt: true,
} satisfies Prisma.TransactionSelect

type BillingActivityRecord = Prisma.TransactionGetPayload<{
  select: typeof recentBillingActivitySelect
}>

function getEmptyBillingOverview(): BillingOverview {
  return {
    currency: "VND",
    walletBalance: 0,
    walletBalanceLabel: formatCurrency(0),
    totalSpent: 0,
    totalSpentLabel: formatCurrency(0),
    totalTopups: 0,
    totalTopupsLabel: formatCurrency(0),
    successfulPayments: 0,
    pendingTransactions: 0,
    recentActivity: [],
  }
}

function getBillingPrefix(type: TransactionType) {
  return type === TransactionType.PAYMENT ? "-" : "+"
}

function mapBillingActivity(activity: BillingActivityRecord): BillingActivityItem {
  const amount = Number(activity.amount)

  return {
    id: activity.id,
    type: activity.type,
    status: activity.status,
    amount,
    amountLabel: `${getBillingPrefix(activity.type)}${formatCurrency(amount, activity.currency)}`,
    description: activity.description,
    createdAt: activity.createdAt,
  }
}

export const getBillingOverview = cache(async (userId: string) => {
  if (!userId) {
    return getEmptyBillingOverview()
  }

  try {
    const prisma = getPrismaClient()
    const [wallet, orderAggregate, topupAggregate, successfulPayments, pendingTransactions, recentActivity] =
      await Promise.all([
        prisma.wallet.findUnique({
          where: {
            userId,
          },
          select: {
            balance: true,
            currency: true,
          },
        }),
        prisma.order.aggregate({
          where: {
            userId,
            paymentStatus: TransactionStatus.COMPLETED,
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.TOPUP,
            status: TransactionStatus.COMPLETED,
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.count({
          where: {
            userId,
            type: TransactionType.PAYMENT,
            status: TransactionStatus.COMPLETED,
          },
        }),
        prisma.transaction.count({
          where: {
            userId,
            status: TransactionStatus.PENDING,
          },
        }),
        prisma.transaction.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: recentBillingActivitySelect,
        }),
      ])

    const currency = wallet?.currency ?? "VND"
    const walletBalance = Number(wallet?.balance ?? 0)
    const totalSpent = Number(orderAggregate._sum.totalAmount ?? 0)
    const totalTopups = Number(topupAggregate._sum.amount ?? 0)

    return {
      currency,
      walletBalance,
      walletBalanceLabel: formatCurrency(walletBalance, currency),
      totalSpent,
      totalSpentLabel: formatCurrency(totalSpent, currency),
      totalTopups,
      totalTopupsLabel: formatCurrency(totalTopups, currency),
      successfulPayments,
      pendingTransactions,
      recentActivity: recentActivity.map(mapBillingActivity),
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load billing overview.", error)
    }

    return getEmptyBillingOverview()
  }
})
