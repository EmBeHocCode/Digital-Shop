import { NextResponse } from "next/server";
import { searchProducts } from "@/services/search-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const results = await searchProducts({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as
      | "VPS"
      | "CLOUD"
      | "GIFTCARD"
      | "GAMECARD"
      | "DIGITAL"
      | null) ?? undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    tag: searchParams.get("tag") ?? undefined,
    page: Number(searchParams.get("page") ?? "1")
  });

  return NextResponse.json(results);
}
