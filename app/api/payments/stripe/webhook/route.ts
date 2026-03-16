import { Prisma, PaymentProvider } from "@prisma/client"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getPrismaClient } from "@/lib/db/prisma"
import { getStripeClient } from "@/lib/payments/stripe"
import {
  handleStripeCheckoutCanceled,
  handleStripeCheckoutFailed,
  handleStripeCheckoutSucceeded,
} from "@/features/payment/services/payment-state-sync"

export const runtime = "nodejs"

function isStripeCheckoutSession(
  value: Stripe.Event.Data.Object
): value is Stripe.Checkout.Session {
  return (
    typeof value === "object" &&
    value !== null &&
    "object" in value &&
    value.object === "checkout.session"
  )
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      {
        success: false,
        message: "Stripe webhook secret chưa được cấu hình.",
      },
      { status: 503 }
    )
  }

  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        message: "Thiếu chữ ký webhook.",
      },
      { status: 400 }
    )
  }

  const stripe = getStripeClient()
  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Webhook không hợp lệ.",
      },
      { status: 400 }
    )
  }

  const prisma = getPrismaClient()

  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.STRIPE,
        eventId: event.id,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({
        success: true,
        duplicated: true,
      })
    }

    throw error
  }

  try {
    if (isStripeCheckoutSession(event.data.object)) {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        await handleStripeCheckoutSucceeded(event.data.object)
      }

      if (event.type === "checkout.session.async_payment_failed") {
        await handleStripeCheckoutFailed(event.data.object)
      }

      if (event.type === "checkout.session.expired") {
        await handleStripeCheckoutCanceled(event.data.object)
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: {
        eventId: event.id,
      },
      data: {
        processedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stripe webhook processing failed", error)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Không thể xử lý webhook Stripe lúc này.",
      },
      { status: 500 }
    )
  }
}
