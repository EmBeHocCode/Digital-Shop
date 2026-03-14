import { prisma } from "@/lib/prisma";
import { getOrderByCode } from "@/services/order-service";

export async function completeOrderWithFulfillment(orderCode: string) {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      items: {
        include: {
          product: true
        }
      },
      payment: true,
      giftCardCodes: true,
      serviceRecords: {
        include: {
          vpsInstance: true,
          product: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    return null;
  }

  if (order.payment && order.payment.status !== "SUCCESS") {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        callbackLog: [
          `Gateway ${order.payment.gateway} xác nhận thành công lúc ${new Date().toISOString()}`
        ]
      }
    });
  }

  for (const item of order.items) {
    if (["GIFTCARD", "GAMECARD"].includes(item.product.type)) {
      const availableCodes = await prisma.giftCardCode.findMany({
        where: {
          productId: item.productId,
          status: "AVAILABLE"
        },
        orderBy: {
          createdAt: "asc"
        },
        take: item.quantity
      });

      for (const code of availableCodes) {
        await prisma.giftCardCode.update({
          where: { id: code.id },
          data: {
            status: "SOLD",
            orderId: order.id,
            reservedAt: code.reservedAt ?? new Date(),
            soldAt: new Date()
          }
        });
      }
    }

    if (["VPS", "CLOUD"].includes(item.product.type)) {
      const existingRecord = order.serviceRecords.find((record) => record.productId === item.productId);
      if (!existingRecord) {
        const serviceRecord = await prisma.serviceRecord.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            productId: item.productId,
            type: item.product.type === "VPS" ? "VPS" : "CLOUD",
            serviceName: `${item.product.name} - Auto Provision`,
            status: item.product.type === "VPS" ? "ACTIVE" : "PROCESSING",
            renewAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            deliveryLog: [
              "Tạo service record",
              item.product.type === "VPS" ? "Khởi tạo máy chủ" : "Đang chuẩn bị cloud node"
            ]
          }
        });

        if (item.product.type === "VPS") {
          await prisma.vpsInstance.create({
            data: {
              userId: order.userId,
              productId: item.productId,
              serviceRecordId: serviceRecord.id,
              ipAddress: `103.14.21.${120 + Math.floor(Math.random() * 40)}`,
              username: "root",
              password: `Meow@${order.userId.slice(-4)}`,
              controlPanelUrl: `https://panel.meowmarket.vn/services/${serviceRecord.id}`,
              status: "ACTIVE",
              renewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            }
          });
        }
      }
    }
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date()
    }
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: "Đơn hàng đã hoàn tất",
      description: `Đơn ${order.orderCode} đã hoàn tất và dữ liệu giao hàng số đã cập nhật.`,
      type: "ORDER",
      level: "SUCCESS",
      link: `/profile/orders/${order.orderCode}`
    }
  });

  return getOrderByCode(orderCode);
}
