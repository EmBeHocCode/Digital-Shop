import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaServiceRecord } from "@/services/sql-mappers";

export async function getServiceRecords() {
  return runSafeDbQuery([], async () => {
    const records = await prisma.serviceRecord.findMany({
      include: {
        product: {
          select: {
            name: true
          }
        },
        vpsInstance: true
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return records.map(mapPrismaServiceRecord);
  });
}

export async function getUserServiceRecords(userId: string) {
  return runSafeDbQuery([], async () => {
    const records = await prisma.serviceRecord.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true
          }
        },
        vpsInstance: true
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return records.map(mapPrismaServiceRecord);
  });
}
