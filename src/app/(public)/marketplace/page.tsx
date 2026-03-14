import type { Metadata } from "next";
import { HomePage } from "@/modules/home/home-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description
};

export default async function MarketplaceRoute() {
  return <HomePage />;
}
