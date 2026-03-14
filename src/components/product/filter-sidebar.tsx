import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCategories } from "@/services/product-service";
import type { ProductType } from "@/types/domain";

const types: ProductType[] = ["VPS", "CLOUD", "GIFTCARD", "GAMECARD"];

export async function FilterSidebar() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-muted">Loại sản phẩm</p>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <Link key={type} href={`/products?type=${type}`}>
              <Badge label={type} />
            </Link>
          ))}
        </div>
      </Card>
      <Card>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-muted">Danh mục</p>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id}>
              <Link href={`/products?category=${category.id}`} className="font-semibold text-ink">
                {category.name}
              </Link>
              <div className="mt-2 space-y-2 pl-3 text-sm text-muted">
                {category.children?.map((child) => (
                  <Link key={child.id} href={`/products?category=${child.id}`} className="block">
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-muted">Mức giá</p>
        <div className="space-y-2 text-sm text-muted">
          <Link href="/products?priceMax=200000" className="block rounded-2xl bg-slate-50 px-4 py-3">
            Dưới 200.000đ
          </Link>
          <Link href="/products?priceMin=200000&priceMax=600000" className="block rounded-2xl bg-slate-50 px-4 py-3">
            200.000đ - 600.000đ
          </Link>
          <Link href="/products?priceMin=600000" className="block rounded-2xl bg-slate-50 px-4 py-3">
            Trên 600.000đ
          </Link>
        </div>
      </Card>
      <Card>
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-muted">Tag phổ biến</p>
        <div className="flex flex-wrap gap-2">
          {["Tự động giao", "Gaming", "Cloud GPU", "Ưu đãi", "Windows"].map((tag) => (
            <Link key={tag} href={`/products?tag=${encodeURIComponent(tag)}`}>
              <Badge label={tag} />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
