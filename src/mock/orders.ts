import { Order } from "@/types/domain";

export const orders: Order[] = [
  {
    id: "order-01",
    orderCode: "MM240301",
    userId: "user-01",
    status: "COMPLETED",
    createdAt: "2026-03-01T10:30:00.000Z",
    subtotal: 389000,
    total: 389000,
    discount: 0,
    adminNote: "Khách hàng ưu tiên được cấp code và VPS ngay sau xác nhận.",
    items: [
      {
        id: "item-01",
        productId: "prod-vps-basic",
        type: "VPS",
        quantity: 1,
        unitPrice: 189000,
        totalPrice: 189000
      },
      {
        id: "item-02",
        productId: "prod-steam-wallet",
        type: "GIFTCARD",
        quantity: 1,
        unitPrice: 200000,
        totalPrice: 200000
      }
    ],
    payment: {
      id: "pay-01",
      orderId: "order-01",
      method: "VNPAY",
      status: "SUCCESS",
      amount: 389000,
      transactionCode: "VNPAY-MM240301-20260301",
      gateway: "VNPAY",
      createdAt: "2026-03-01T10:32:00.000Z"
    },
    assignedCodes: [
      {
        id: "gc-01",
        productId: "prod-steam-wallet",
        code: "STEAM-2Q9A-KT73-PM41",
        status: "SOLD",
        createdAt: "2026-03-01T10:33:00.000Z",
        soldAt: "2026-03-01T10:35:00.000Z"
      }
    ],
    provisionedVps: [
      {
        id: "vps-01",
        userId: "user-01",
        productId: "prod-vps-basic",
        orderId: "order-01",
        productName: "VPS Basic",
        type: "VPS",
        serviceName: "VPS Basic - Ha Noi Zone",
        ipAddress: "103.14.21.110",
        username: "root",
        password: "Meow@2026",
        status: "ACTIVE",
        createdAt: "2026-03-01T10:34:00.000Z",
        renewAt: "2026-04-01T10:34:00.000Z",
        deliveryLog: ["Tạo service record", "Khởi tạo thông tin máy chủ", "Gửi tài khoản truy cập"],
        panelUrl: "https://panel.meowmarket.vn/services/vps-01"
      }
    ],
    timeline: [
      {
        id: "timeline-01",
        label: "Đơn hàng được tạo",
        detail: "Hệ thống ghi nhận đơn MM240301.",
        createdAt: "2026-03-01T10:30:00.000Z",
        type: "ORDER"
      },
      {
        id: "timeline-02",
        label: "Thanh toán thành công",
        detail: "Giao dịch VNPay đã xác nhận thành công.",
        createdAt: "2026-03-01T10:32:00.000Z",
        type: "PAYMENT"
      },
      {
        id: "timeline-03",
        label: "Fulfillment hoàn tất",
        detail: "Gift card và VPS đã được giao tới dashboard người dùng.",
        createdAt: "2026-03-01T10:35:00.000Z",
        type: "FULFILLMENT"
      }
    ]
  },
  {
    id: "order-02",
    orderCode: "MM240286",
    userId: "user-01",
    status: "PROCESSING",
    createdAt: "2026-02-27T14:00:00.000Z",
    subtotal: 599000,
    total: 569000,
    discount: 30000,
    note: "Khách hàng yêu cầu cấu hình cloud gaming ưu tiên node TP.HCM.",
    items: [
      {
        id: "item-03",
        productId: "prod-cloud-gaming",
        type: "CLOUD",
        quantity: 1,
        unitPrice: 599000,
        totalPrice: 599000
      }
    ],
    payment: {
      id: "pay-02",
      orderId: "order-02",
      method: "MOMO",
      status: "SUCCESS",
      amount: 569000,
      transactionCode: "MOMO-MM240286-20260227",
      gateway: "MOMO",
      createdAt: "2026-02-27T14:02:00.000Z"
    },
    timeline: [
      {
        id: "timeline-04",
        label: "Đơn hàng được tạo",
        detail: "Khách hàng bắt đầu checkout cloud gaming.",
        createdAt: "2026-02-27T14:00:00.000Z",
        type: "ORDER"
      },
      {
        id: "timeline-05",
        label: "Thanh toán thành công",
        detail: "Ví MoMo trả callback thành công.",
        createdAt: "2026-02-27T14:02:00.000Z",
        type: "PAYMENT"
      },
      {
        id: "timeline-06",
        label: "Provisioning đang chạy",
        detail: "Cloud node đang được chuẩn bị.",
        createdAt: "2026-02-27T14:10:00.000Z",
        type: "FULFILLMENT"
      }
    ]
  },
  {
    id: "order-03",
    orderCode: "MM240270",
    userId: "user-01",
    status: "PENDING",
    createdAt: "2026-02-24T08:00:00.000Z",
    subtotal: 100000,
    total: 100000,
    discount: 0,
    items: [
      {
        id: "item-04",
        productId: "prod-garena",
        type: "GAMECARD",
        quantity: 1,
        unitPrice: 100000,
        totalPrice: 100000
      }
    ],
    payment: {
      id: "pay-03",
      orderId: "order-03",
      method: "ZALOPAY",
      status: "PENDING",
      amount: 100000,
      gateway: "ZALOPAY",
      createdAt: "2026-02-24T08:01:00.000Z"
    },
    timeline: [
      {
        id: "timeline-07",
        label: "Đơn hàng được tạo",
        detail: "Đơn game card đang chờ khách hoàn tất thanh toán.",
        createdAt: "2026-02-24T08:00:00.000Z",
        type: "ORDER"
      }
    ]
  }
];
