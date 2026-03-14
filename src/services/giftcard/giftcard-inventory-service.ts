import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaGiftCardCode } from "@/services/sql-mappers";

export async function getGiftCardInventory() {
  return runSafeDbQuery([], async () => {
    const codes = await prisma.giftCardCode.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    return codes.map(mapPrismaGiftCardCode);
  });
}

export async function getLowStockGiftCards() {
  return runSafeDbQuery([], async () => {
    const grouped = await prisma.giftCardCode.groupBy({
      by: ["productId"],
      where: {
        status: "AVAILABLE"
      },
      _count: {
        productId: true
      }
    });

    return grouped
      .sort((a, b) => a._count.productId - b._count.productId)
      .slice(0, 6);
  });
}

export async function reserveGiftCardCode(productId: string, orderId: string) {
  const code = await prisma.giftCardCode.findFirst({
    where: {
      productId,
      status: "AVAILABLE"
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!code) {
    return null;
  }

  const updated = await prisma.giftCardCode.update({
    where: { id: code.id },
    data: {
      status: "RESERVED",
      orderId,
      reservedAt: new Date()
    }
  });

  return mapPrismaGiftCardCode(updated);
}
