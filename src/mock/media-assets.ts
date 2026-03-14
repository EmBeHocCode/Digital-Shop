import { MediaAsset } from "@/types/domain";

export const mediaAssets: MediaAsset[] = [
  {
    id: "media-01",
    fileName: "logo-meowmarket.svg",
    fileUrl: "/logos/meowmarket-logo.svg",
    altText: "Logo MeowMarket",
    uploadedBy: "admin-01",
    createdAt: "2026-02-18T08:00:00.000Z",
    fileType: "image/svg+xml",
    size: 18240,
    usageType: "LOGO",
    driver: "LOCAL"
  },
  {
    id: "media-02",
    fileName: "hero-vps-banner.jpg",
    fileUrl: "/images/banners/hero-vps-banner.jpg",
    altText: "Banner hero dịch vụ VPS",
    uploadedBy: "admin-01",
    createdAt: "2026-02-19T08:00:00.000Z",
    fileType: "image/jpeg",
    size: 248000,
    usageType: "BANNER",
    driver: "LOCAL"
  },
  {
    id: "media-03",
    fileName: "steam-wallet-thumb.png",
    fileUrl: "/images/products/steam-wallet-thumb.png",
    altText: "Ảnh sản phẩm Steam Wallet",
    uploadedBy: "admin-01",
    createdAt: "2026-02-19T09:00:00.000Z",
    fileType: "image/png",
    size: 121000,
    usageType: "PRODUCT_IMAGE",
    driver: "LOCAL"
  }
];
