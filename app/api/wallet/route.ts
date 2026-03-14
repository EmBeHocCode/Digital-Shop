import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { getTransactionHistory } from "@/features/wallet/services/get-transaction-history"
import { getWalletSummary } from "@/features/wallet/services/get-wallet-summary"

export async function GET() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần đăng nhập để xem ví.",
      },
      { status: 401 }
    )
  }

  const [wallet, transactions] = await Promise.all([
    getWalletSummary(session.user.id),
    getTransactionHistory(session.user.id),
  ])

  return NextResponse.json({
    success: true,
    wallet,
    transactions,
  })
}
