import { Prisma, type TransactionStatus, type TransactionType, type WalletStatus } from "@prisma/client"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"

export interface AdminWalletFilters {
  search?: string
  walletStatus?: WalletStatus | "ALL"
  transactionStatus?: TransactionStatus | "ALL"
  transactionType?: TransactionType | "ALL"
}

export interface AdminWalletRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  balanceLabel: string
  status: string
  transactionCount: number
  updatedAt: Date
}

export interface AdminTransactionRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  walletId: string | null
  orderId: string | null
  type: string
  status: string
  amountLabel: string
  description: string | null
  reference: string | null
  createdAt: Date
}

export interface AdminWalletOverview {
  wallets: AdminWalletRow[]
  transactions: AdminTransactionRow[]
  summary: {
    totalBalance: number
    totalBalanceLabel: string
    activeWallets: number
    lockedWallets: number
    pendingTransactions: number
  }
}

function buildUserSearch(search?: string): Prisma.UserWhereInput {
  if (!search?.trim()) {
    return {}
  }

  const value = search.trim()

  return {
    OR: [
      { name: { contains: value, mode: "insensitive" } },
      { email: { contains: value, mode: "insensitive" } },
      { phone: { contains: value, mode: "insensitive" } },
    ],
  }
}

export async function getAdminWalletOverview(
  filters: AdminWalletFilters = {}
): Promise<AdminWalletOverview> {
  const prisma = getPrismaClient()
  const userWhere = buildUserSearch(filters.search)

  const [wallets, transactions, totalBalanceAggregate, activeWallets, lockedWallets, pendingTransactions] =
    await Promise.all([
      prisma.wallet.findMany({
        where: {
          ...(filters.walletStatus && filters.walletStatus !== "ALL"
            ? { status: filters.walletStatus }
            : {}),
          ...(Object.keys(userWhere).length > 0 ? { user: { is: userWhere } } : {}),
        },
        orderBy: [
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 20,
        select: {
          id: true,
          userId: true,
          balance: true,
          currency: true,
          status: true,
          updatedAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...(filters.transactionStatus && filters.transactionStatus !== "ALL"
            ? { status: filters.transactionStatus }
            : {}),
          ...(filters.transactionType && filters.transactionType !== "ALL"
            ? { type: filters.transactionType }
            : {}),
          ...(filters.search?.trim()
            ? {
                OR: [
                  { description: { contains: filters.search.trim(), mode: "insensitive" } },
                  { reference: { contains: filters.search.trim(), mode: "insensitive" } },
                  { user: { is: buildUserSearch(filters.search) } },
                ],
              }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
        select: {
          id: true,
          userId: true,
          walletId: true,
          orderId: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          description: true,
          reference: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.wallet.aggregate({
        _sum: {
          balance: true,
        },
      }),
      prisma.wallet.count({ where: { status: "ACTIVE" } }),
      prisma.wallet.count({ where: { status: "LOCKED" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
    ])

  const totalBalance = Number(totalBalanceAggregate._sum.balance ?? 0)

  return {
    wallets: wallets.map((wallet) => ({
      id: wallet.id,
      userId: wallet.userId,
      userName: wallet.user.name || "NexCloud User",
      userEmail: wallet.user.email,
      balanceLabel: formatCurrency(Number(wallet.balance), wallet.currency),
      status: wallet.status,
      transactionCount: wallet._count.transactions,
      updatedAt: wallet.updatedAt,
    })),
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      userName: transaction.user.name || "NexCloud User",
      userEmail: transaction.user.email,
      walletId: transaction.walletId,
      orderId: transaction.orderId,
      type: transaction.type,
      status: transaction.status,
      amountLabel: formatCurrency(Number(transaction.amount), transaction.currency),
      description: transaction.description,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
    })),
    summary: {
      totalBalance,
      totalBalanceLabel: formatCurrency(totalBalance),
      activeWallets,
      lockedWallets,
      pendingTransactions,
    },
  }
}
