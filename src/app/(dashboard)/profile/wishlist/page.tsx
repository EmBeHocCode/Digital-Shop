import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";

export default async function ProfileWishlistRoute() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Wishlist</h1>
      {profile.wishlistProducts.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {profile.wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Wishlist đang trống"
          description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích."
          ctaLabel="Khám phá sản phẩm"
          ctaLink="/products"
        />
      )}
    </div>
  );
}
