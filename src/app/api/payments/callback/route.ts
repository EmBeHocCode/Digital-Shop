import { NextResponse } from "next/server";
import { processMockPaymentCallback } from "@/services/payment/payment-gateway-service";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    callback: processMockPaymentCallback({
      transactionCode: body.transactionCode as string,
      status: body.status as "SUCCESS" | "FAILED",
      orderCode: body.orderCode as string
    })
  });
}
