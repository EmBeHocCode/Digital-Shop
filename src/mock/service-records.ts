import { ServiceRecord, VpsService } from "@/types/domain";

export const serviceRecords: Array<ServiceRecord | VpsService> = [
  {
    id: "service-01",
    userId: "user-01",
    orderId: "order-01",
    productId: "prod-vps-basic",
    productName: "VPS Basic",
    type: "VPS",
    serviceName: "VPS Basic - Ha Noi Zone",
    status: "ACTIVE",
    createdAt: "2026-03-01T10:34:00.000Z",
    renewAt: "2026-04-01T10:34:00.000Z",
    deliveryLog: [
      "Tạo service record",
      "Khởi tạo thông tin máy chủ",
      "Gửi tài khoản truy cập"
    ],
    ipAddress: "103.14.21.110",
    username: "root",
    password: "********",
    panelUrl: "https://panel.meowmarket.vn/services/vps-01"
  },
  {
    id: "service-02",
    userId: "user-01",
    orderId: "order-02",
    productId: "prod-cloud-gaming",
    productName: "Cloud Gaming",
    type: "CLOUD",
    serviceName: "Cloud Gaming - HCM GPU Pool",
    status: "PROCESSING",
    createdAt: "2026-02-27T14:12:00.000Z",
    renewAt: "2026-03-27T14:12:00.000Z",
    deliveryLog: ["Tạo service record", "Đang chờ node GPU"]
  }
];
