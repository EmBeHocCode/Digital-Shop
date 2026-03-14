import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaNotification, mapPrismaUser } from "@/services/sql-mappers";

function getRecentDayLabels(days: number) {
  return Array.from({ length: days }).map((_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - (days - index - 1));
    return current;
  });
}

export async function getMarketplaceAnalytics() {
  return runSafeDbQuery(
    {
      revenue: 0,
      orderCount: 0,
      userCount: 0,
      paymentSuccessRate: 0,
      latestRegistrations: [],
      lowStockProducts: [],
      recentAlerts: []
    },
    async () => {
      const [ordersAggregate, orderCount, userCount, paymentsCount, successPaymentsCount, users, lowStockProducts, alerts] =
        await Promise.all([
          prisma.order.aggregate({
            _sum: {
              total: true
            }
          }),
          prisma.order.count(),
          prisma.user.count(),
          prisma.payment.count(),
          prisma.payment.count({
            where: { status: "SUCCESS" }
          }),
          prisma.user.findMany({
            orderBy: [{ createdAt: "desc" }],
            take: 5
          }),
          prisma.product.findMany({
            where: {
              isPublished: true,
              stock: {
                lt: 20
              }
            },
            orderBy: [{ stock: "asc" }, { name: "asc" }],
            take: 5
          }),
          prisma.notification.findMany({
            orderBy: [{ createdAt: "desc" }],
            take: 5
          })
        ]);

      return {
        revenue: Number(ordersAggregate._sum.total ?? 0),
        orderCount,
        userCount,
        paymentSuccessRate: paymentsCount ? Math.round((successPaymentsCount / paymentsCount) * 100) : 0,
        latestRegistrations: users.map(mapPrismaUser),
        lowStockProducts: lowStockProducts.map((product) => ({
          id: product.id,
          name: product.name,
          stock: product.stock
        })),
        recentAlerts: alerts.map(mapPrismaNotification)
      };
    }
  );
}

export async function getDashboardChartData(days = 7) {
  return runSafeDbQuery(
    {
      revenue: [] as Array<{ name: string; revenue: number }>,
      orders: [] as Array<{ name: string; orders: number }>,
      users: [] as Array<{ name: string; users: number }>
    },
    async () => {
      const dates = getRecentDayLabels(days);
      const startDate = new Date(dates[0]);
      startDate.setHours(0, 0, 0, 0);

      const [orders, users] = await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate
            }
          },
          select: {
            createdAt: true,
            total: true
          }
        }),
        prisma.user.findMany({
          where: {
            createdAt: {
              gte: startDate
            }
          },
          select: {
            createdAt: true
          }
        })
      ]);

      const revenue = dates.map((date) => {
        const name = `T${date.getDate()}`;
        const total = orders
          .filter((order) => order.createdAt.toDateString() === date.toDateString())
          .reduce((sum, order) => sum + Number(order.total), 0);

        return { name, revenue: total };
      });

      const ordersSeries = dates.map((date) => ({
        name: `T${date.getDate()}`,
        orders: orders.filter((order) => order.createdAt.toDateString() === date.toDateString()).length
      }));

      let cumulativeUsers = 0;
      const usersSeries = dates.map((date) => {
        cumulativeUsers += users.filter((user) => user.createdAt.toDateString() === date.toDateString()).length;
        return {
          name: `T${date.getDate()}`,
          users: cumulativeUsers
        };
      });

      return {
        revenue,
        orders: ordersSeries,
        users: usersSeries
      };
    }
  );
}
