import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { validateCoupon } from "@/services/payment-service";
import { mapPrismaOrder } from "@/services/sql-mappers";
import type { Order } from "@/types/domain";

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          type: true
        }
      }
    }
  },
  payment: true,
  giftCardCodes: true,
  supportTickets: {
    select: {
      id: true
    }
  },
  serviceRecords: {
    include: {
      product: {
        select: {
          name: true
        }
      },
      vpsInstance: true
    }
  }
} satisfies Prisma.OrderInclude;

export async function getOrders() {
  return runSafeDbQuery<Order[]>([], async () => {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map(mapPrismaOrder);
  });
}

export async function getRecentOrders(limit = 5) {
  return runSafeDbQuery<Order[]>([], async () => {
    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return orders.map(mapPrismaOrder);
  });
}

export async function getOrdersByUser(userId: string) {
  return runSafeDbQuery<Order[]>([], async () => {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map(mapPrismaOrder);
  });
}

export async function getOrderByCode(orderCode: string) {
  return runSafeDbQuery<Order | null>(null, async () => {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: orderInclude
    });

    return order ? mapPrismaOrder(order) : null;
  });
}

export async function getOrderById(orderId: string) {
  return runSafeDbQuery<Order | null>(null, async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude
    });

    return order ? mapPrismaOrder(order) : null;
  });
}

export async function getOrderTotals(
  items: Array<{ productId: string; quantity: number }>,
  couponCode?: string
) {
  if (!items.length) {
    return {
      subtotal: 0,
      coupon: null,
      discount: 0,
      total: 0
    };
  }

  return runSafeDbQuery(
    {
      subtotal: 0,
      coupon: null,
      discount: 0,
      total: 0
    },
    async () => {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds
          }
        },
        select: {
          id: true,
          price: true
        }
      });

      const priceMap = new Map(products.map((product) => [product.id, Number(product.price)]));
      const subtotal = items.reduce((total, item) => {
        return total + (priceMap.get(item.productId) ?? 0) * item.quantity;
      }, 0);

      const { coupon, discount } = couponCode
        ? await validateCoupon(couponCode, subtotal)
        : { coupon: null, discount: 0 };

      return {
        subtotal,
        coupon,
        discount,
        total: Math.max(0, subtotal - discount)
      };
    }
  );
}

export function calculateOrderTotalsLocally(
  items: Array<{ quantity: number; price: number }>,
  discount = 0
) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount)
  };
}

export async function getDashboardStats() {
  return runSafeDbQuery(
    {
      revenue: 0,
      orders: 0,
      users: 0,
      conversionRate: 0
    },
    async () => {
      const [revenueAggregate, ordersCount, usersCount] = await Promise.all([
        prisma.order.aggregate({
          where: {
            status: {
              in: ["PAID", "PROCESSING", "COMPLETED"]
            }
          },
          _sum: {
            total: true
          }
        }),
        prisma.order.count(),
        prisma.user.count()
      ]);

      return {
        revenue: Number(revenueAggregate._sum.total ?? 0),
        orders: ordersCount,
        users: usersCount,
        conversionRate: usersCount ? Number(((ordersCount / usersCount) * 100).toFixed(1)) : 0
      };
    }
  );
}
