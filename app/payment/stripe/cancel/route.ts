import { NextResponse } from "next/server"
import { cancelStripeOrderByIds } from "@/features/payment/services/payment-state-sync"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get("orderId")
  const paymentIntentId = url.searchParams.get("paymentIntentId")
  const transactionId = url.searchParams.get("transactionId")
  const paymentReference = url.searchParams.get("paymentReference")

  if (orderId) {
    await cancelStripeOrderByIds({
      orderId,
      paymentIntentId,
      transactionId,
      paymentReference,
    }).catch(() => undefined)
  }

  const redirectUrl = new URL("/checkout", request.url)
  redirectUrl.searchParams.set("payment", "cancelled")

  if (orderId) {
    redirectUrl.searchParams.set("orderId", orderId)
  }

  return NextResponse.redirect(redirectUrl)
}
