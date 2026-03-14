import { NextResponse } from "next/server";
import { createMockPaymentIntent } from "@/services/payment/payment-gateway-service";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    intent: createMockPaymentIntent({
      orderCode: body.orderCode as string,
      gateway: body.gateway as "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO",
      amount: Number(body.amount)
    })
  });
}
