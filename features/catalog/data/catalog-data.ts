import type { LucideIcon } from "lucide-react"
import {
  Cloud,
  Gamepad2,
  Globe2,
  Headset,
  Server,
  ShieldCheck,
  Signal,
  Smartphone,
  Wallet,
} from "lucide-react"
import { catalogProductContent } from "@/features/catalog/data/catalog-content"
import type { CatalogProductContent, CatalogService } from "@/features/catalog/types"

const catalogIcons: Record<string, LucideIcon> = {
  vps: Server,
  "cloud-server": Cloud,
  giftcard: Wallet,
  "game-cards": Gamepad2,
  sim: Smartphone,
  topup: Signal,
}

export function getCatalogIcon(slug: string) {
  return catalogIcons[slug] ?? Globe2
}

export function mapCatalogContentToService(
  content: CatalogProductContent
): CatalogService {
  return {
    slug: content.slug,
    name: content.name,
    tagline: content.tagline,
    description: content.description,
    price: content.priceLabel,
    priceValue: content.priceValue,
    category: content.category,
    domain: content.domain,
    icon: getCatalogIcon(content.slug),
    features: content.features,
    highlights: content.highlights,
    idealFor: content.idealFor,
    operations: content.operations,
    isFeatured: content.isFeatured ?? false,
    sortOrder: content.sortOrder ?? 0,
    imageUrl: content.imageUrl ?? null,
  }
}

export const catalogServices = catalogProductContent.map(mapCatalogContentToService)

export function getCatalogService(slug: string) {
  return catalogServices.find((service) => service.slug === slug)
}

export function getCatalogServicePaths() {
  return catalogServices.map((service) => ({ slug: service.slug }))
}

export const publicServiceLinks = catalogServices.map((service) => ({
  name: service.name,
  href: `/services/${service.slug}`,
}))

export function getCatalogSummaryStats(services: CatalogService[]) {
  const totalDomains = new Set(services.map((service) => service.domain)).size

  return [
    { label: "Sản phẩm active", value: services.length.toString() },
    { label: "Domain", value: totalDomains.toString() },
    { label: "Kích hoạt", value: "Realtime" },
    { label: "Hỗ trợ", value: "Liên tục" },
  ]
}

export const catalogValueProps = [
  {
    title: "Tốc độ triển khai",
    description:
      "Từ VPS đến topup, mọi sản phẩm được thiết kế để giảm thời gian chờ và tăng tỷ lệ hoàn tất giao dịch.",
    icon: Globe2,
  },
  {
    title: "Vận hành ổn định",
    description:
      "Quản lý trạng thái đơn, dịch vụ và cấu hình qua một luồng thống nhất, dễ mở rộng cho phase sau.",
    icon: ShieldCheck,
  },
  {
    title: "Hỗ trợ khi cần",
    description:
      "Các page catalog mới đóng vai trò nền cho flow bán hàng, tư vấn và điều hướng người dùng vào dashboard.",
    icon: Headset,
  },
]
