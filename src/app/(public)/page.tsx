import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LandingPage } from "@/modules/landing/landing-page";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Dịch vụ số mềm mại cho người dùng Việt`,
  description:
    "Khám phá MeowMarket với VPS, cloud, gift card và thẻ game trong một trải nghiệm thương mại điện tử mềm mại, hiện đại và đáng tin cậy."
};

export default async function HomeRoute() {
  return <LandingPage />;
}
