import type { Metadata } from "next";
import { AboutPage } from "@/modules/settings/about-page";

export const metadata: Metadata = {
  title: "Giới thiệu | MeowMarket",
  description: "Câu chuyện thương hiệu, sứ mệnh và lý do chọn MeowMarket."
};

export default function AboutRoute() {
  return <AboutPage />;
}
