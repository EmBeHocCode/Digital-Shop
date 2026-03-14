import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaNotification } from "@/services/sql-mappers";

export async function getNotificationFeed(userId?: string, limit = 4) {
  return runSafeDbQuery([], async () => {
    const notifications = await prisma.notification.findMany({
      where: userId
        ? {
            OR: [{ userId }, { userId: null }]
          }
        : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return notifications.map(mapPrismaNotification);
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
}
