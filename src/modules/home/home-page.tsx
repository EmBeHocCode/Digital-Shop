import {
  getCategories,
  getFeaturedProducts,
  getHotProducts,
  getPromotionProducts
} from "@/services/product-service";
import { getBanners, getFaqs, getFeaturedReviews, getHomepageMetrics } from "@/services/content-service";
import { BannerSlider } from "@/components/product/banner-slider";
import { CategoryCard } from "@/components/product/category-card";
import { HeroBanner } from "@/components/product/hero-banner";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { ReviewCard } from "@/components/shared/review-card";
import { SectionReveal } from "@/components/shared/section-reveal";

export async function HomePage() {
  const [banners, categories, faqs, reviews, metrics, hotProducts, featuredProducts, promotionProducts] =
    await Promise.all([
      getBanners(),
      getCategories(),
      getFaqs(),
      getFeaturedReviews(3),
      getHomepageMetrics(),
      getHotProducts(),
      getFeaturedProducts(),
      getPromotionProducts()
    ]);

  const heroBanner = banners.find((banner) => banner.placement === "HERO") ?? banners[0];
  const promotionBanners = banners.filter((banner) => banner.placement !== "HERO");

  return (
    <div className="space-y-12">
      {heroBanner ? <HeroBanner banner={heroBanner} /> : null}

      <SectionReveal>
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            [new Intl.NumberFormat("vi-VN").format(metrics.monthlyRevenue) + " đ", "Doanh thu tháng này", "doanh-thu"],
            [new Intl.NumberFormat("vi-VN").format(metrics.processedOrders), "Đơn hàng đã xử lý", "don-hang"],
            [metrics.averageRating ? `${metrics.averageRating.toFixed(1)}/5` : "0/5", "Mức hài lòng trung bình", "danh-gia"],
            [String(metrics.openTickets), "Phiếu hỗ trợ đang mở cần theo dõi", "ticket"]
          ].map(([value, label, key]) => (
            <Card key={key}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-3 text-3xl font-black text-ink">{value}</p>
            </Card>
          ))}
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Danh mục nổi bật"
            title="Nhóm dịch vụ số được trình bày rõ như một sàn dịch vụ thật"
            description="Vẫn giữ cảm giác mềm mại và dễ dùng nhưng phân cấp đủ mạnh để khách tìm đúng loại sản phẩm trong vài giây."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Đề xuất nổi bật"
            title="Sản phẩm được mua nhiều và phù hợp người dùng mới"
            description="Danh sách ưu tiên sản phẩm dễ ra quyết định, bao phủ từ VPS, cloud đến gift card và thẻ game."
          />
          {featuredProducts.length ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <EmptyState
              title="Chưa có sản phẩm nổi bật"
              description="Kho sản phẩm trong cơ sở dữ liệu hiện đang trống. Hãy thêm sản phẩm từ trang quản trị hoặc Prisma seed."
            />
          )}
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Khuyến mãi"
            title="Banner khuyến mãi và CTA thương mại rõ ràng"
            description="Cấu trúc sẵn sàng cho thanh trượt banner thực tế hoặc hệ quản trị nội dung sau này."
          />
          {promotionBanners.length ? (
            <BannerSlider banners={promotionBanners} />
          ) : (
            <EmptyState
              title="Chưa có banner khuyến mãi"
              description="Thêm banner trong SQL để hiển thị khu vực khuyến mãi của MeowMarket."
            />
          )}
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Bán chạy"
            title="Sản phẩm bán chạy cho cloud, gift card và dịch vụ số"
            description="Nhóm thẻ sản phẩm được tối ưu hiệu ứng rê chuột, khoảng cách và nút hành động để tạo cảm giác gọn gàng, chuyên nghiệp."
          />
          {hotProducts.length ? (
            <ProductGrid products={hotProducts} />
          ) : (
            <EmptyState
              title="Chưa có sản phẩm bán chạy"
              description="Dữ liệu sản phẩm hiện đang đọc từ PostgreSQL và chưa có bản ghi nào."
            />
          )}
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Card className="bg-gradient-to-br from-[#fff0f6] to-[#eef3ff]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Giao hàng số</p>
            <h2 className="mt-4 text-3xl font-black text-ink">Giao mã và cấp dịch vụ số theo từng loại sản phẩm</h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-muted">
              <p>Gift card và thẻ game được cấp code từ kho mã và gắn vào chi tiết đơn hàng.</p>
              <p>VPS và cloud tạo bản ghi dịch vụ riêng, sẵn sàng nối với API nhà cung cấp bên ngoài.</p>
              <p>Phiếu hỗ trợ, phản hồi thanh toán và lịch sử đơn được thiết kế để dễ truy vết.</p>
            </div>
            <div className="mt-6">
              <Button href="/products">Mua ngay</Button>
            </div>
          </Card>
          {promotionProducts.length ? (
            <ProductGrid products={promotionProducts} />
          ) : (
            <EmptyState
              title="Chưa có sản phẩm khuyến mãi"
              description="Thêm sản phẩm vào PostgreSQL và bật cờ khuyến mãi để hiển thị tại đây."
            />
          )}
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Hướng dẫn mua hàng"
            title="Quy trình đơn giản nhưng vẫn đủ tin cậy cho giao dịch số"
            description="Mỗi bước đều được chuẩn bị để nối với hệ thống máy chủ thật, cổng thanh toán thật và hệ thống bàn giao thật."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Tìm sản phẩm bằng thanh tìm kiếm hoặc mega menu danh mục",
              "Đọc mô tả, cấu hình, FAQ và đánh giá trước khi mua",
              "Thêm vào giỏ hàng, áp mã giảm giá và chọn cổng thanh toán",
              "Theo dõi trạng thái đơn, mã giao hàng và phiếu hỗ trợ trong trang cá nhân"
            ].map((step, index) => (
              <Card key={step} className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-blue-100 text-secondary">
                  <span className="text-lg font-black">{index + 1}</span>
                </div>
                <p className="text-base font-semibold text-ink">{step}</p>
              </Card>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Đối tác và niềm tin"
            title="Mô phỏng khu vực tạo niềm tin của một sàn dịch vụ lớn"
            description="Khu vực này dùng để đặt logo đối tác, nhà cung cấp hạ tầng, cổng thanh toán và các tín hiệu tin cậy."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {["VNPay", "MoMo", "ZaloPay", "Cloud Node", "Đối tác gaming"].map((partner) => (
              <Card key={partner} className="flex items-center justify-center py-8 text-center">
                <p className="text-base font-bold text-ink">{partner}</p>
              </Card>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Đánh giá khách hàng"
            title="Đánh giá giúp tăng cảm giác tin cậy trước khi thanh toán"
            description="Cấu trúc thẻ đánh giá đã sẵn sàng cho xác minh mua hàng và kiểm duyệt sau này."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="FAQ"
              title="Giải đáp nhanh các câu hỏi phổ biến"
              description="Giải thích rõ luồng giao mã gift card, cấp phát VPS, thanh toán và bảo vệ tuyến truy cập."
            />
            <FAQAccordion items={faqs} />
          </div>
          <Card className="flex flex-col justify-between bg-ink text-white">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-200">CTA</p>
              <h3 className="mt-4 text-3xl font-black">MeowMarket cho trải nghiệm mua dịch vụ số mềm mại hơn</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Từ gift card đến VPS, toàn bộ luồng được tổ chức để sau này thay dữ liệu mẫu bằng PostgreSQL và API CRUD thật.
              </p>
            </div>
            <div className="mt-6">
              <Button href="/products">Khám phá MeowMarket</Button>
            </div>
          </Card>
        </section>
      </SectionReveal>
    </div>
  );
}
