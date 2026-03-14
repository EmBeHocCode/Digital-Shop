import { ProductCard } from "@/components/product/product-card";
import { ProductPurchaseActions } from "@/components/product/product-purchase-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { getFaqs } from "@/services/content-service";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/services/product-service";
import { formatCurrency, formatDate } from "@/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { getProductDisplayMaxPrice, getProductDisplayPrice } from "@/utils/product";

export async function ProductDetailPage({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm này chưa tồn tại trong cơ sở dữ liệu hoặc đã bị gỡ khỏi cửa hàng."
          ctaLabel="Quay lại danh sách"
        />
      );
  }

  const [relatedProducts, reviews, faqs] = await Promise.all([
    getRelatedProducts(product.id),
    getProductReviews(product.id),
    getFaqs()
  ]);
  const minPrice = getProductDisplayPrice(product);
  const maxPrice = getProductDisplayMaxPrice(product);
  const isDigitalCodeProduct = product.type === "GIFTCARD" || product.type === "GAMECARD";

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-gradient-to-br from-[#fff0f6] via-white to-[#eef3ff]">
          <Badge label={product.type} />
          <h1 className="mt-4 text-4xl font-black text-ink">{product.name}</h1>
          <p className="mt-4 text-base leading-8 text-muted">{product.description}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {product.specs
              ? Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="rounded-[24px] bg-white/80 p-4">
                    <p className="text-sm capitalize text-muted">{key}</p>
                    <p className="mt-1 font-semibold text-ink">{value}</p>
                  </div>
                ))
              : product.tags.map((tag) => (
                  <div key={tag} className="rounded-[24px] bg-white/80 p-4">
                    <p className="font-semibold text-ink">{tag}</p>
                  </div>
                ))}
          </div>
        </Card>
        <Card className="space-y-6">
          <div>
            <p className="text-sm text-muted">
              {product.configurationOptions?.length ? "Giá theo cấu hình" : "Giá bán"}
            </p>
            <p className="mt-2 text-4xl font-black text-ink">{formatCurrency(minPrice)}</p>
            {maxPrice > minPrice ? (
              <p className="mt-2 text-sm text-muted">Khoảng giá đến {formatCurrency(maxPrice)}</p>
            ) : null}
          </div>
          <p className="text-sm leading-7 text-muted">{product.shortDescription}</p>
          <ProductPurchaseActions product={product} />
          <div className="rounded-[24px] bg-rose-50 p-4 text-sm leading-7 text-muted">
            {isDigitalCodeProduct ? (
              <>
                Sau khi thanh toán thành công, {product.type === "GIFTCARD" ? "mã gift" : "mã thẻ"}
                {" "}sẽ hiển thị trong chi tiết đơn hàng với nút sao chép nhanh.
              </>
            ) : (
              <>
                Với VPS/CLOUD, bạn có thể chọn preset cấu hình như các website bán hosting phổ biến.
                Sau khi đơn hoàn tất, dịch vụ sẽ xuất hiện ở mục Dịch vụ của tôi.
              </>
            )}
          </div>
        </Card>
      </section>

      {isDigitalCodeProduct ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <h2 className="text-2xl font-bold text-ink">Nhận mã sau thanh toán</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  {product.type === "GIFTCARD" ? "Mã gift" : "Mã thẻ"}
                </p>
                <p className="mt-4 rounded-2xl bg-white px-4 py-3 font-mono text-lg font-semibold text-ink">
                  XXXX-XXXX-XXXX
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Mã thật chỉ hiển thị sau khi giao dịch được xác nhận thành công.
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Cách giao hàng
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
                  <p>1. Thanh toán thành công.</p>
                  <p>2. Hệ thống cấp mã vào đơn hàng và email.</p>
                  <p>3. Bạn có thể mở lại đơn để sao chép bất cứ lúc nào.</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-2xl font-bold text-ink">Đánh giá khách hàng</h2>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[24px] border border-rose-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{review.title}</p>
                  <Badge label={`${review.rating}/5`} />
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{review.content}</p>
                <p className="mt-4 text-xs text-muted">
                  {review.userName} • {formatDate(review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold text-ink">FAQ sản phẩm</h2>
            <div className="mt-6">
              <FAQAccordion items={faqs.slice(0, 3)} />
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-ink">Sản phẩm tương tự</h2>
        {relatedProducts.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có sản phẩm tương tự"
            description="Cơ sở dữ liệu hiện chưa có thêm sản phẩm cùng nhóm để đề xuất."
          />
        )}
      </section>
    </div>
  );
}
