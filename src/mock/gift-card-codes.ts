import { GiftCardCode } from "@/types/domain";

export const giftCardCodes: GiftCardCode[] = [
  {
    id: "gift-01",
    productId: "prod-steam-wallet",
    code: "STEAM-AB12-CD34-EF56",
    status: "AVAILABLE",
    createdAt: "2026-02-10T09:00:00.000Z"
  },
  {
    id: "gift-02",
    productId: "prod-google-play",
    code: "GPAY-QR78-ST90-UV12",
    status: "AVAILABLE",
    createdAt: "2026-02-11T09:00:00.000Z"
  },
  {
    id: "gift-03",
    productId: "prod-garena",
    code: "GARENA-WX34-YZ56-AB78",
    status: "SOLD",
    createdAt: "2026-02-12T09:00:00.000Z",
    orderId: "order-01",
    soldAt: "2026-03-01T10:35:00.000Z"
  }
];
