import type { Metadata } from "next";
import { ProductListPage } from "@/modules/products/product-list-page";
import type { ProductType } from "@/types/domain";

export const metadata: Metadata = {
  title: "Sản phẩm | MeowMarket",
  description: "Danh sách VPS, cloud, gift card và thẻ game trên MeowMarket."
};

export default async function ProductsRoute({
  searchParams
}: {
  searchParams: {
    q?: string;
    category?: string;
    type?: ProductType;
    promotion?: string;
    priceMin?: string;
    priceMax?: string;
    tag?: string;
    sort?: "featured" | "price-asc" | "price-desc" | "rating" | "popularity" | "newest";
    page?: string;
  };
}) {
  return (
    <ProductListPage
      q={searchParams.q}
      category={searchParams.category}
      type={searchParams.type}
      promotion={searchParams.promotion === "true"}
      priceMin={searchParams.priceMin ? Number(searchParams.priceMin) : undefined}
      priceMax={searchParams.priceMax ? Number(searchParams.priceMax) : undefined}
      tag={searchParams.tag}
      sort={searchParams.sort}
      page={searchParams.page ? Number(searchParams.page) : 1}
    />
  );
}
