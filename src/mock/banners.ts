import { Banner } from "@/types/domain";

export const banners: Banner[] = [
  {
    id: "banner-hero-01",
    title: "Marketplace dịch vụ số cho người dùng Việt",
    subtitle: "Mềm mại, đáng tin cậy, tối ưu như startup công nghệ",
    description:
      "Mua VPS, cloud gaming, gift card và thẻ game với luồng thanh toán rõ ràng, giao mã tự động và hỗ trợ nhanh.",
    ctaLabel: "Mua ngay",
    ctaLink: "/products",
    placement: "HERO"
  },
  {
    id: "banner-promo-01",
    title: "Ưu đãi cloud gaming cuối tuần",
    subtitle: "Giảm đến 12% cho user mới",
    description:
      "Áp dụng cho nhóm sản phẩm cloud gaming và cloud server trong khung giờ ưu đãi.",
    ctaLabel: "Xem ưu đãi",
    ctaLink: "/products?promotion=true",
    placement: "PROMOTION"
  }
];
