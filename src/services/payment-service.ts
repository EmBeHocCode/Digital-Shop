import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import type { Coupon, PaymentMethod } from "@/types/domain";

export const paymentMethods: Array<{
  id: PaymentMethod;
  name: string;
  description: string;
}> = [
  {
    id: "VNPAY",
    name: "VNPay",
    description: "Phù hợp thanh toán nội địa nhanh với QR và ngân hàng."
  },
  {
    id: "MOMO",
    name: "MoMo",
    description: "Ví điện tử phổ biến, xác nhận giao dịch nhanh."
  },
  {
    id: "ZALOPAY",
    name: "ZaloPay",
    description: "Luồng thanh toán thuận tiện trên mobile."
  },
  {
    id: "CRYPTO",
    name: "Crypto",
    description: "Cấu trúc đã sẵn sàng cho thanh toán tiền mã hóa."
  }
];

function mapCoupon(coupon: {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: { toNumber: () => number };
  minOrderValue: { toNumber: () => number } | null;
  usageLimit: number | null;
  isActive: boolean;
}): Coupon {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? "",
    discountType: coupon.discountType as Coupon["discountType"],
    discountValue: coupon.discountValue.toNumber(),
    minOrderValue: coupon.minOrderValue?.toNumber() ?? 0,
    usageLimit: coupon.usageLimit ?? undefined,
    isActive: coupon.isActive
  };
}

export async function getCoupons() {
  return runSafeDbQuery<Coupon[]>([], async () => {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        endsAt: {
          gte: new Date()
        }
      },
      orderBy: [{ startsAt: "asc" }]
    });

    return coupons.map(mapCoupon);
  });
}

export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await runSafeDbQuery<Coupon | null>(null, async () => {
    const record = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive"
        },
        isActive: true,
        startsAt: {
          lte: new Date()
        },
        endsAt: {
          gte: new Date()
        }
      }
    });

    return record ? mapCoupon(record) : null;
  });

  if (!coupon) {
    return { coupon: null, discount: 0 };
  }

  if (subtotal < coupon.minOrderValue) {
    return { coupon, discount: 0 };
  }

  const discount =
    coupon.discountType === "PERCENT"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  return { coupon, discount };
}
