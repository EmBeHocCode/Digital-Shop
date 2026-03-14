import { getProducts } from "@/services/product-service";
import type { ProductType } from "@/types/domain";

export async function searchProducts(params: {
  q?: string;
  category?: string;
  type?: ProductType;
  priceMin?: number;
  priceMax?: number;
  tag?: string;
  page?: number;
}) {
  return getProducts({
    q: params.q,
    category: params.category,
    type: params.type,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    tag: params.tag,
    page: params.page,
    pageSize: 12,
    sort: "featured"
  });
}
