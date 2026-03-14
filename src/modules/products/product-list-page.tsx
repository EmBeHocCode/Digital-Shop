import { FilterSidebar } from "@/components/product/filter-sidebar";
import { ProductGrid } from "@/components/product/product-grid";
import { SortBar } from "@/components/product/sort-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProducts } from "@/services/product-service";
import type { ProductType } from "@/types/domain";

export async function ProductListPage({
  q,
  category,
  type,
  promotion,
  priceMin,
  priceMax,
  tag,
  sort,
  page
}: {
  q?: string;
  category?: string;
  type?: ProductType;
  promotion?: boolean;
  priceMin?: number;
  priceMax?: number;
  tag?: string;
  sort?:
    | "featured"
    | "price-asc"
    | "price-desc"
    | "rating"
    | "popularity"
    | "newest";
  page?: number;
}) {
  const result = await getProducts({
    q,
    category,
    type,
    promotion,
    priceMin,
    priceMax,
    tag,
    sort,
    page,
    pageSize: 9
  });

  const createPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (promotion) params.set("promotion", "true");
    if (typeof priceMin === "number") params.set("priceMin", String(priceMin));
    if (typeof priceMax === "number") params.set("priceMax", String(priceMax));
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);
    params.set("page", String(nextPage));
    return `/products?${params.toString()}`;
  };

  const createSortHref = (
    nextSort:
      | "featured"
      | "price-asc"
      | "price-desc"
      | "rating"
      | "popularity"
      | "newest"
  ) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (promotion) params.set("promotion", "true");
    if (typeof priceMin === "number") params.set("priceMin", String(priceMin));
    if (typeof priceMax === "number") params.set("priceMax", String(priceMax));
    if (tag) params.set("tag", tag);
    params.set("sort", nextSort);
    params.set("page", "1");
    return `/products?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Danh sách sản phẩm"
        title="Danh sách sản phẩm rõ ràng với bộ lọc, sắp xếp và phân trang"
        description="Tìm theo tên, danh mục, loại sản phẩm, mức giá và thẻ gắn. Bố cục được tối ưu để khách duyệt sản phẩm như một marketplace dịch vụ số thực thụ."
      />
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <FilterSidebar />
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-card">
            <div>
              <p className="text-sm text-muted">Kết quả</p>
              <p className="text-lg font-bold text-ink">{result.totalItems} sản phẩm</p>
            </div>
            <SortBar createHref={createSortHref} activeSort={sort} />
          </div>
          {result.items.length ? (
            <>
              <ProductGrid products={result.items} />
              <Pagination
                currentPage={result.currentPage}
                totalPages={result.totalPages}
                createPageHref={createPageHref}
              />
            </>
          ) : (
            <EmptyState
              title="Chưa có sản phẩm phù hợp"
              description="Thử đổi bộ lọc, khoảng giá hoặc từ khóa tìm kiếm để xem kết quả khác."
              ctaLabel="Làm mới bộ lọc"
              ctaLink="/products"
            />
          )}
        </div>
      </div>
    </div>
  );
}
