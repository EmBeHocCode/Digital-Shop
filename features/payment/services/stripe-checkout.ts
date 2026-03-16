import Stripe from "stripe"
import { buildAppUrl } from "@/lib/app-url"
import { getStripeClient, toStripeAmount } from "@/lib/payments/stripe"
import type { CartItemConfiguration } from "@/features/cart/types"

export interface StripeCheckoutItem {
  name: string
  tagline: string
  quantity: number
  unitPrice: number
  currency: string
  slug: string
  configuration?: CartItemConfiguration
}

export interface CreateStripeCheckoutSessionInput {
  orderId: string
  paymentIntentId: string
  transactionId: string
  paymentReference: string
  customerEmail: string
  customerName: string
  note?: string
  currency: string
  items: StripeCheckoutItem[]
  request?: Request | null
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutSessionInput) {
  const stripe = getStripeClient()
  const successUrl = buildAppUrl(
    `/order/success?orderId=${encodeURIComponent(input.orderId)}&payment=stripe`,
    input.request ?? null
  )
  const cancelUrl = buildAppUrl(
    `/payment/stripe/cancel?orderId=${encodeURIComponent(input.orderId)}&paymentIntentId=${encodeURIComponent(input.paymentIntentId)}&transactionId=${encodeURIComponent(input.transactionId)}&paymentReference=${encodeURIComponent(input.paymentReference)}`,
    input.request ?? null
  )

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: input.customerEmail,
    payment_method_types: ["card"],
    client_reference_id: input.orderId,
    metadata: {
      orderId: input.orderId,
      paymentIntentId: input.paymentIntentId,
      transactionId: input.transactionId,
      paymentReference: input.paymentReference,
      customerEmail: input.customerEmail,
    },
    payment_intent_data: {
      metadata: {
        orderId: input.orderId,
        paymentIntentId: input.paymentIntentId,
        transactionId: input.transactionId,
        paymentReference: input.paymentReference,
      },
    },
    line_items: input.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: item.currency.toLowerCase(),
        unit_amount: toStripeAmount(item.unitPrice, item.currency),
        product_data: {
          name: item.configuration ? `${item.name} • ${item.configuration.title}` : item.name,
          description:
            item.configuration?.summaryLines.join(" • ") ||
            item.tagline ||
            "Dịch vụ số trên NexCloud",
          metadata: {
            slug: item.slug,
          },
        },
      },
    })),
    locale: "vi",
    custom_text: input.note
      ? {
          submit: {
            message: input.note,
          },
        }
      : undefined,
  })

  return {
    id: session.id,
    url: session.url,
  }
}

export function getStripeCheckoutSessionIds(session: Stripe.Checkout.Session) {
  return {
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
  }
}
