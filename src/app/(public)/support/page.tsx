import type { Metadata } from "next";
import { SupportPage } from "@/modules/support/support-page";

export const metadata: Metadata = {
  title: "Hỗ trợ | MeowMarket",
  description: "FAQ, biểu mẫu hỗ trợ, hướng dẫn mua hàng và thanh toán."
};

export default function SupportRoute() {
  return <SupportPage />;
}
