import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { getNotificationFeed } from "@/services/notification-service";
import { getOrderByCode, getOrdersByUser } from "@/services/order-service";
import { getTicketsByUser } from "@/services/ticket-service";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaProduct, mapPrismaServiceRecord } from "@/services/sql-mappers";

export async function getCurrentProfileData() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return {
      user: null,
      orders: [],
      payments: [],
      services: [],
      tickets: [],
      notifications: [],
      wishlistProducts: [],
      purchasedProducts: [],
      spentTotal: 0,
      latestOrder: null
    };
  }

  const [userOrders, userTickets, userNotifications, wishlistProducts, purchasedProducts, services] =
    await Promise.all([
      getOrdersByUser(user.id),
      getTicketsByUser(user.id),
      getNotificationFeed(user.id, 20),
      runSafeDbQuery([], async () => {
        const favorites = await prisma.favorite.findMany({
          where: { userId: user.id },
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        return favorites.map((favorite) => mapPrismaProduct(favorite.product));
      }),
      runSafeDbQuery([], async () => {
        const items = await prisma.orderItem.findMany({
          where: {
            order: {
              userId: user.id,
              status: {
                in: ["PAID", "PROCESSING", "COMPLETED"]
              }
            }
          },
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: "asc" }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });

        const uniqueProducts = new Map(items.map((item) => [item.product.id, item.product]));
        return [...uniqueProducts.values()].map(mapPrismaProduct);
      }),
      runSafeDbQuery([], async () => {
        const records = await prisma.serviceRecord.findMany({
          where: { userId: user.id },
          include: {
            product: {
              select: {
                name: true
              }
            },
            vpsInstance: true
          },
          orderBy: { createdAt: "desc" }
        });

        return records.map(mapPrismaServiceRecord);
      })
    ]);

  return {
    user,
    orders: userOrders,
    payments: userOrders.map((order) => order.payment),
    services,
    tickets: userTickets,
    notifications: userNotifications,
    wishlistProducts,
    purchasedProducts,
    spentTotal: userOrders.reduce((sum, order) => sum + order.total, 0),
    latestOrder: userOrders[0] ?? null
  };
}

export async function getCurrentUserOrderByCode(orderCode: string) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return null;
  }

  const order = await getOrderByCode(orderCode);
  if (!order || order.userId !== user.id) {
    return null;
  }

  return order;
}

export async function getCurrentUserTicketById(ticketId: string) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return null;
  }

  const tickets = await getTicketsByUser(user.id);
  const ticket = tickets.find((entry) => entry.id === ticketId);
  return ticket ?? null;
}
