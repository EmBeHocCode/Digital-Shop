import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentIntentStatus,
  Prisma,
  TransactionStatus,
} from "@prisma/client"
import type Stripe from "stripe"
import { getPrismaClient } from "@/lib/db/prisma"

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeMetadata(
  current: Prisma.JsonValue | null | undefined,
  extra: Record<string, unknown>
): Prisma.InputJsonValue {
  return {
    ...(isJsonObject(current) ? current : {}),
    ...extra,
  } as Prisma.InputJsonObject
}

function getStripeSessionMetadata(session: Stripe.Checkout.Session) {
  return {
    orderId: session.metadata?.orderId ?? session.client_reference_id ?? null,
    paymentIntentId: session.metadata?.paymentIntentId ?? null,
    transactionId: session.metadata?.transactionId ?? null,
    paymentReference: session.metadata?.paymentReference ?? null,
  }
}

async function updateOrderPaymentState(input: {
  orderId: string
  paymentIntentId: string | null
  transactionId: string | null
  paymentReference: string | null
  stripeSessionId: string
  stripePaymentIntentId: string | null
  checkoutStatus: string | null
  nextIntentStatus: PaymentIntentStatus
  nextTransactionStatus: TransactionStatus
  nextOrderStatus: OrderStatus
}) {
  const prisma = getPrismaClient()

  await prisma.$transaction(async (tx) => {
    const storedPaymentIntent = input.paymentIntentId
      ? await tx.paymentIntent.findUnique({
          where: {
            id: input.paymentIntentId,
          },
          select: {
            id: true,
            metadata: true,
            orderId: true,
            transactionId: true,
          },
        })
      : await tx.paymentIntent.findFirst({
          where: {
            orderId: input.orderId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            metadata: true,
            orderId: true,
            transactionId: true,
          },
        })

    const transactionId = input.transactionId ?? storedPaymentIntent?.transactionId ?? null

    if (storedPaymentIntent) {
      await tx.paymentIntent.update({
        where: {
          id: storedPaymentIntent.id,
        },
        data: {
          provider: PaymentProvider.STRIPE,
          method: PaymentMethod.CARD,
          status: input.nextIntentStatus,
          externalIntentId: input.stripePaymentIntentId ?? input.stripeSessionId,
          metadata: mergeMetadata(storedPaymentIntent.metadata, {
            stripeCheckoutSessionId: input.stripeSessionId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            checkoutStatus: input.checkoutStatus,
            lastSyncedAt: new Date().toISOString(),
          }),
        },
      })
    }

    if (transactionId) {
      const transaction = await tx.transaction.findUnique({
        where: {
          id: transactionId,
        },
        select: {
          id: true,
          metadata: true,
        },
      })

      if (transaction) {
        await tx.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            status: input.nextTransactionStatus,
            paymentMethod: PaymentMethod.CARD,
            paymentProvider: PaymentProvider.STRIPE,
            reference: input.paymentReference,
            metadata: mergeMetadata(transaction.metadata, {
              stripeCheckoutSessionId: input.stripeSessionId,
              stripePaymentIntentId: input.stripePaymentIntentId,
              checkoutStatus: input.checkoutStatus,
              lastSyncedAt: new Date().toISOString(),
            }),
          },
        })
      }
    }

    await tx.order.update({
      where: {
        id: input.orderId,
      },
      data: {
        status: input.nextOrderStatus,
        paymentMethod: PaymentMethod.CARD,
        paymentProvider: PaymentProvider.STRIPE,
        paymentStatus: input.nextTransactionStatus,
        paymentReference: input.paymentReference,
      },
    })
  })
}

export async function persistStripeCheckoutSession(input: {
  paymentIntentId: string
  checkoutSessionId: string
  checkoutUrl: string | null
}) {
  const prisma = getPrismaClient()
  const record = await prisma.paymentIntent.findUnique({
    where: {
      id: input.paymentIntentId,
    },
    select: {
      id: true,
      metadata: true,
    },
  })

  if (!record) {
    return
  }

  await prisma.paymentIntent.update({
    where: {
      id: record.id,
    },
    data: {
      externalIntentId: input.checkoutSessionId,
      metadata: mergeMetadata(record.metadata, {
        stripeCheckoutSessionId: input.checkoutSessionId,
        checkoutUrl: input.checkoutUrl,
      }),
    },
  })
}

export async function markStripeOrderSetupFailed(input: {
  orderId: string
  paymentIntentId: string
  transactionId: string
  paymentReference: string
  reason: string
}) {
  const prisma = getPrismaClient()

  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: {
        id: input.paymentIntentId,
      },
      data: {
        status: PaymentIntentStatus.FAILED,
        metadata: {
          failureReason: input.reason,
          failedAt: new Date().toISOString(),
        },
      },
    })

    await tx.transaction.update({
      where: {
        id: input.transactionId,
      },
      data: {
        status: TransactionStatus.FAILED,
        paymentMethod: PaymentMethod.CARD,
        paymentProvider: PaymentProvider.STRIPE,
        reference: input.paymentReference,
        metadata: {
          failureReason: input.reason,
          failedAt: new Date().toISOString(),
        },
      },
    })

    await tx.order.update({
      where: {
        id: input.orderId,
      },
      data: {
        status: OrderStatus.FAILED,
        paymentMethod: PaymentMethod.CARD,
        paymentProvider: PaymentProvider.STRIPE,
        paymentStatus: TransactionStatus.FAILED,
        paymentReference: input.paymentReference,
      },
    })
  })
}

export async function handleStripeCheckoutSucceeded(session: Stripe.Checkout.Session) {
  const metadata = getStripeSessionMetadata(session)

  if (!metadata.orderId) {
    return
  }

  await updateOrderPaymentState({
    orderId: metadata.orderId,
    paymentIntentId: metadata.paymentIntentId,
    transactionId: metadata.transactionId,
    paymentReference: metadata.paymentReference,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    checkoutStatus: session.payment_status ?? null,
    nextIntentStatus: PaymentIntentStatus.SUCCEEDED,
    nextTransactionStatus: TransactionStatus.COMPLETED,
    nextOrderStatus: OrderStatus.PROCESSING,
  })
}

export async function handleStripeCheckoutCanceled(session: Stripe.Checkout.Session) {
  const metadata = getStripeSessionMetadata(session)

  if (!metadata.orderId) {
    return
  }

  await updateOrderPaymentState({
    orderId: metadata.orderId,
    paymentIntentId: metadata.paymentIntentId,
    transactionId: metadata.transactionId,
    paymentReference: metadata.paymentReference,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    checkoutStatus: session.payment_status ?? null,
    nextIntentStatus: PaymentIntentStatus.CANCELED,
    nextTransactionStatus: TransactionStatus.CANCELLED,
    nextOrderStatus: OrderStatus.CANCELLED,
  })
}

export async function handleStripeCheckoutFailed(session: Stripe.Checkout.Session) {
  const metadata = getStripeSessionMetadata(session)

  if (!metadata.orderId) {
    return
  }

  await updateOrderPaymentState({
    orderId: metadata.orderId,
    paymentIntentId: metadata.paymentIntentId,
    transactionId: metadata.transactionId,
    paymentReference: metadata.paymentReference,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    checkoutStatus: session.payment_status ?? null,
    nextIntentStatus: PaymentIntentStatus.FAILED,
    nextTransactionStatus: TransactionStatus.FAILED,
    nextOrderStatus: OrderStatus.FAILED,
  })
}

export async function cancelStripeOrderByIds(input: {
  orderId: string
  paymentIntentId?: string | null
  transactionId?: string | null
  paymentReference?: string | null
}) {
  await updateOrderPaymentState({
    orderId: input.orderId,
    paymentIntentId: input.paymentIntentId ?? null,
    transactionId: input.transactionId ?? null,
    paymentReference: input.paymentReference ?? null,
    stripeSessionId: "checkout_cancelled",
    stripePaymentIntentId: null,
    checkoutStatus: "cancelled",
    nextIntentStatus: PaymentIntentStatus.CANCELED,
    nextTransactionStatus: TransactionStatus.CANCELLED,
    nextOrderStatus: OrderStatus.CANCELLED,
  })
}
