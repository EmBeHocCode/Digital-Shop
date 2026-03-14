import { NextResponse } from "next/server";
import { getProducts } from "@/services/product-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await getProducts({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as
      | "VPS"
      | "CLOUD"
      | "GIFTCARD"
      | "GAMECARD"
      | "DIGITAL"
      | null) ?? undefined,
    promotion: searchParams.get("promotion") === "true",
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    tag: searchParams.get("tag") ?? undefined,
    sort:
      (searchParams.get("sort") as
        | "featured"
        | "price-asc"
        | "price-desc"
        | "rating"
        | "popularity"
        | "newest"
        | null) ?? "featured",
    page: Number(searchParams.get("page") ?? "1")
  });

  return NextResponse.json(data);
}
