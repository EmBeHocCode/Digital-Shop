import type { Metadata } from "next";
import { ProductListPage } from "@/modules/products/product-list-page";
import type { ProductType } from "@/types/domain";

export const metadata: Metadata = {
  title: "Tìm kiếm | MeowMarket",
  description: "Tìm sản phẩm theo tên, danh mục và loại sản phẩm."
};

export default async function SearchRoute({
  searchParams
}: {
  searchParams: {
    q?: string;
    category?: string;
    type?: ProductType;
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
      priceMin={searchParams.priceMin ? Number(searchParams.priceMin) : undefined}
      priceMax={searchParams.priceMax ? Number(searchParams.priceMax) : undefined}
      tag={searchParams.tag}
      sort={searchParams.sort}
      page={searchParams.page ? Number(searchParams.page) : 1}
    />
  );
}
