import { Prisma, TransactionStatus } from "@prisma/client"
import { cache } from "react"
import { getPrismaClient } from "@/lib/db/prisma"
import { formatCurrency } from "@/lib/utils"
import {
  getPaymentMethodLabel,
  getPaymentProviderLabel,
  mapPrismaPaymentMethodToCode,
  mapPrismaPaymentProviderToCode,
} from "@/features/payment/utils"

export interface BillingInvoiceRecord {
  id: string
  reference: string
  customerName: string | null
  totalAmount: number
  totalAmountLabel: string
  paymentMethodLabel: string
  paymentProviderLabel: string
  createdAt: Date
}

const billingInvoiceSelect = {
  id: true,
  paymentReference: true,
  customerName: true,
  totalAmount: true,
  currency: true,
  paymentMethod: true,
  paymentProvider: true,
  createdAt: true,
} satisfies Prisma.OrderSelect

type BillingInvoiceSource = Prisma.OrderGetPayload<{
  select: typeof billingInvoiceSelect
}>

function mapBillingInvoice(record: BillingInvoiceSource): BillingInvoiceRecord {
  return {
    id: record.id,
    reference: record.paymentReference ?? record.id,
    customerName: record.customerName,
    totalAmount: Number(record.totalAmount),
    totalAmountLabel: formatCurrency(Number(record.totalAmount), record.currency),
    paymentMethodLabel: getPaymentMethodLabel(mapPrismaPaymentMethodToCode(record.paymentMethod)),
    paymentProviderLabel: getPaymentProviderLabel(
      mapPrismaPaymentProviderToCode(record.paymentProvider)
    ),
    createdAt: record.createdAt,
  }
}

export const getBillingInvoices = cache(async (userId: string, take = 8) => {
  if (!userId) {
    return [] as BillingInvoiceRecord[]
  }

  try {
    const prisma = getPrismaClient()
    const orders = await prisma.order.findMany({
      where: {
        userId,
        paymentStatus: TransactionStatus.COMPLETED,
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      select: billingInvoiceSelect,
    })

    return orders.map(mapBillingInvoice)
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load billing invoices.", error)
    }

    return [] as BillingInvoiceRecord[]
  }
})
