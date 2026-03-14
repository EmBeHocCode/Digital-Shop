import { NextResponse } from "next/server";
import { completeOrderWithFulfillment } from "@/services/mock-fulfillment-service";
import { getOrderByCode, getOrders } from "@/services/order-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get("orderCode");

  if (orderCode) {
    return NextResponse.json({
      order: (await getOrderByCode(orderCode)) ?? null
    });
  }

  return NextResponse.json({
    orders: await getOrders()
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const orderCode = body.orderCode as string;

  return NextResponse.json({
    order: await completeOrderWithFulfillment(orderCode)
  });
}
