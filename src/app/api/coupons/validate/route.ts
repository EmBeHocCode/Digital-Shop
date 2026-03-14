import { NextResponse } from "next/server";
import { validateCoupon } from "@/services/payment-service";

export async function POST(request: Request) {
  const body = await request.json();
  const subtotal = Number(body.subtotal ?? 0);
  const code = String(body.code ?? "").trim();

  if (!code) {
    return NextResponse.json({
      coupon: null,
      discount: 0,
      total: subtotal
    });
  }

  const result = await validateCoupon(code, subtotal);

  return NextResponse.json({
    coupon: result.coupon,
    discount: result.discount,
    total: Math.max(0, subtotal - result.discount)
  });
}
