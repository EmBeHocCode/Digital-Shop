import { paymentCallbackSchema, paymentIntentSchema } from "@/validators";

export function createMockPaymentIntent(payload: {
  orderCode: string;
  gateway: "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
  amount: number;
}) {
  const validated = paymentIntentSchema.parse(payload);

  return {
    gateway: validated.gateway,
    orderCode: validated.orderCode,
    amount: validated.amount,
    transactionCode: `${validated.gateway}-${validated.orderCode}-${Date.now()}`,
    checkoutUrl: `/checkout/${validated.gateway.toLowerCase()}?orderCode=${validated.orderCode}`,
    status: "PENDING" as const
  };
}

export function processMockPaymentCallback(payload: {
  transactionCode: string;
  status: "SUCCESS" | "FAILED";
  orderCode: string;
}) {
  const validated = paymentCallbackSchema.parse(payload);

  return {
    ...validated,
    processedAt: new Date().toISOString(),
    paymentStatus: validated.status
  };
}
