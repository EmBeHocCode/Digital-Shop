import type { Metadata } from "next";
import { PromotionsPage } from "@/modules/banners/promotions-page";

export const metadata: Metadata = {
  title: "Khuyến mãi | MeowMarket",
  description: "Ưu đãi, banner nổi bật và coupon đang hoạt động."
};

export default function PromotionsRoute() {
  return <PromotionsPage />;
}
