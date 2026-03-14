import type { Metadata } from "next";
import { ProductDetailPage } from "@/modules/products/product-detail-page";

export const metadata: Metadata = {
  title: "Chi tiết sản phẩm | MeowMarket",
  description: "Thông tin cấu hình, đánh giá, FAQ và sản phẩm tương tự."
};

export default async function ProductDetailRoute({
  params
}: {
  params: { slug: string };
}) {
  return <ProductDetailPage slug={params.slug} />;
}
