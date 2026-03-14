import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import {
  mapPrismaAuditLog,
  mapPrismaBanner,
  mapPrismaFaq,
  mapPrismaMediaAsset,
  mapPrismaNotification,
  mapPrismaReview,
  mapPrismaSiteSetting
} from "@/services/sql-mappers";

export async function getBanners(placement?: "HERO" | "SIDEBAR" | "PROMOTION") {
  return runSafeDbQuery([], async () => {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        placement: placement ?? undefined
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return banners.map(mapPrismaBanner);
  });
}

export async function getFaqs() {
  return runSafeDbQuery([], async () => {
    const items = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return items.map(mapPrismaFaq);
  });
}

export async function getFeaturedReviews(limit = 6) {
  return runSafeDbQuery([], async () => {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [{ verifiedPurchase: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      take: limit
    });

    return reviews.map(mapPrismaReview);
  });
}

export async function getNotifications(userId?: string, limit?: number) {
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

export async function getMediaAssets() {
  return runSafeDbQuery([], async () => {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: [{ createdAt: "desc" }]
    });

    return assets.map(mapPrismaMediaAsset);
  });
}

export async function getAuditLogs(limit?: number) {
  return runSafeDbQuery([], async () => {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return logs.map(mapPrismaAuditLog);
  });
}

export async function getSiteSettings() {
  return runSafeDbQuery(null, async () => {
    const setting = await prisma.siteSetting.findFirst({
      orderBy: { createdAt: "desc" }
    });

    return setting ? mapPrismaSiteSetting(setting) : null;
  });
}

export async function getHomepageMetrics() {
  return runSafeDbQuery(
    {
      monthlyRevenue: 0,
      processedOrders: 0,
      averageRating: 0,
      openTickets: 0
    },
    async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [monthlyOrders, processedOrders, reviewAggregate, openTickets] = await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: startOfMonth
            },
            status: {
              in: ["PAID", "PROCESSING", "COMPLETED"]
            }
          },
          select: {
            total: true
          }
        }),
        prisma.order.count({
          where: {
            status: {
              in: ["PAID", "PROCESSING", "COMPLETED"]
            }
          }
        }),
        prisma.review.aggregate({
          _avg: { rating: true }
        }),
        prisma.supportTicket.count({
          where: {
            status: {
              in: ["OPEN", "IN_PROGRESS"]
            }
          }
        })
      ]);

      return {
        monthlyRevenue: monthlyOrders.reduce((sum, order) => sum + Number(order.total), 0),
        processedOrders,
        averageRating: reviewAggregate._avg.rating ?? 0,
        openTickets
      };
    }
  );
}
