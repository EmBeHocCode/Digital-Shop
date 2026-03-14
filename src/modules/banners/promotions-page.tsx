import { BannerSlider } from "@/components/product/banner-slider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBanners } from "@/services/content-service";
import { getCoupons } from "@/services/payment-service";

export async function PromotionsPage() {
  const [banners, coupons] = await Promise.all([getBanners("PROMOTION"), getCoupons()]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Khuyến mãi"
        title="Ưu đãi đang hoạt động trên MeowMarket"
        description="Tập hợp banner, mã giảm giá và ưu đãi nổi bật cho cloud, VPS, gift card và thẻ game."
      />
      {banners.length ? (
        <BannerSlider banners={banners} />
      ) : (
        <EmptyState
          title="Chưa có banner khuyến mãi"
          description="Dữ liệu banner hiện được quản lý trong SQL và đang để trống."
        />
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className="bg-gradient-to-br from-[#fff4f7] to-[#eef3ff]">
            <p className="text-sm text-muted">Mã khuyến mãi</p>
            <p className="mt-2 text-3xl font-black text-primary">{coupon.code}</p>
            <p className="mt-3 text-sm text-muted">{coupon.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
