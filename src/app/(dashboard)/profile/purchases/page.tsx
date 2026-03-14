import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";

export default async function ProfilePurchasesRoute() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Sản phẩm đã mua</h1>
      {profile.purchasedProducts.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {profile.purchasedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có sản phẩm đã mua"
          description="Khi bạn hoàn tất thanh toán, các sản phẩm đã mua sẽ xuất hiện ở đây."
          ctaLabel="Mua ngay"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
