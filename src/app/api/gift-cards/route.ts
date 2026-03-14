import { NextResponse } from "next/server";
import { completeOrderWithFulfillment } from "@/services/mock-fulfillment-service";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    fulfillment: completeOrderWithFulfillment(body.orderCode as string)
  });
}
