import {
  faArrowRight,
  faBoxOpen,
  faCloudArrowUp,
  faGift,
  faHeadset,
  faLock,
  faServer,
  faShieldHalved,
  faStar,
  faTicket
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionBox } from "@/components/ui/section-box";
import { SectionHeading } from "@/components/ui/section-heading";
import { ReviewCard } from "@/components/shared/review-card";
import { SectionReveal } from "@/components/shared/section-reveal";
import { getFeaturedReviews, getHomepageMetrics } from "@/services/content-service";
import type { Review } from "@/types/domain";

const primaryServices = [
  {
    title: "VPS",
    description: "Máy chủ ảo ổn định cho website, bot và nhiều nhu cầu vận hành hằng ngày.",
    icon: faServer,
    image: "/images/illustrations/vps-server.svg",
    imageAlt: "Minh họa VPS với cụm máy chủ ảo"
  },
  {
    title: "Cloud",
    description: "Cloud server và cloud gaming linh hoạt cho nhu cầu compute, remote work và giải trí.",
    icon: faCloudArrowUp,
    image: "/images/illustrations/cloud-services.svg",
    imageAlt: "Minh họa dịch vụ cloud với các nút hạ tầng kết nối"
  },
  {
    title: "Gift Card",
    description: "Mua gift card cho nhiều nền tảng phổ biến với quy trình đơn giản và dễ theo dõi.",
    icon: faGift,
    image: "/images/illustrations/giftcard.svg",
    imageAlt: "Minh họa gift card số trong môi trường dịch vụ số"
  },
  {
    title: "Thẻ Game",
    description: "Nạp game nhanh chóng cho các tựa game phổ biến với thao tác rõ ràng, quen thuộc.",
    icon: faTicket,
    image: "/images/illustrations/gamecard.svg",
    imageAlt: "Minh họa thẻ game với tay cầm chơi game và thẻ số"
  }
];

const reasons = [
  {
    title: "Danh mục dịch vụ rõ ràng",
    description:
      "VPS, cloud server, cloud gaming và gift card được phân loại để người dùng tìm đúng dịch vụ nhanh hơn.",
    icon: faShieldHalved
  },
  {
    title: "Mua dịch vụ nhanh chóng",
    description:
      "Quy trình từ chọn sản phẩm đến thanh toán được tối giản để hoàn tất đơn hàng chỉ trong vài bước.",
    icon: faArrowRight
  },
  {
    title: "Theo dõi đơn và mã dịch vụ dễ dàng",
    description:
      "Mã gift card, thông tin VPS và trạng thái đơn được hiển thị rõ ràng trong trang cá nhân.",
    icon: faHeadset
  }
];

const steps = [
  {
    title: "Chọn nhu cầu phù hợp",
    description: "Xem nhanh các nhóm dịch vụ chính rồi đi vào marketplace để duyệt sản phẩm chi tiết.",
    icon: faBoxOpen
  },
  {
    title: "So sánh và quyết định",
    description: "Đọc cấu hình, ghi chú giao hàng và thông tin cần thiết trước khi mua.",
    icon: faStar
  },
  {
    title: "Thanh toán an tâm",
    description: "Hoàn tất đơn trong vài bước với trạng thái rõ ràng và dễ theo dõi.",
    icon: faLock
  },
  {
    title: "Nhận sản phẩm nhanh",
    description: "Mã dịch vụ, đơn hàng và thông tin bàn giao được hiển thị tập trung sau khi mua.",
    icon: faGift
  }
];

const fallbackReviews: Review[] = [
  {
    id: "landing-review-1",
    productId: "landing",
    userId: "landing-user-1",
    userName: "Nguyễn Phương Mai",
    rating: 5,
    title: "Mua gift card nhanh và rõ ràng",
    content:
      "Mình tìm đúng loại gift card cần mua rất nhanh, sau đó theo dõi mã và trạng thái đơn cũng dễ hơn mong đợi.",
    verifiedPurchase: true,
    createdAt: "2026-03-01T09:00:00.000Z"
  },
  {
    id: "landing-review-2",
    productId: "landing",
    userId: "landing-user-2",
    userName: "Trần Đức Long",
    rating: 5,
    title: "Dễ chọn gói VPS phù hợp",
    content:
      "Danh mục VPS và cloud được phân chia dễ hiểu nên mình xem cấu hình và chọn đúng gói cần dùng khá nhanh.",
    verifiedPurchase: true,
    createdAt: "2026-03-03T10:30:00.000Z"
  },
  {
    id: "landing-review-3",
    productId: "landing",
    userId: "landing-user-3",
    userName: "Lê Minh Châu",
    rating: 4,
    title: "Theo dõi đơn hàng thuận tiện",
    content:
      "Mình thích việc có thể xem lại đơn, mã dịch vụ và thông tin cần thiết mà không phải tìm quá nhiều chỗ khác nhau.",
    verifiedPurchase: false,
    createdAt: "2026-03-05T14:00:00.000Z"
  }
];

function formatMetricValue(value: number, fallback: string) {
  return value > 0 ? new Intl.NumberFormat("vi-VN").format(value) : fallback;
}

export async function LandingPage() {
  const [metrics, reviews] = await Promise.all([getHomepageMetrics(), getFeaturedReviews(3)]);
  const trustReviews = reviews.length ? reviews : fallbackReviews;

  const trustStats = [
    {
      label: "Giá trị giao dịch tháng này",
      value:
        metrics.monthlyRevenue > 0
          ? `${new Intl.NumberFormat("vi-VN").format(metrics.monthlyRevenue)} đ`
          : "Đang cập nhật"
    },
    {
      label: "Đơn hàng đã xử lý",
      value: formatMetricValue(metrics.processedOrders, "Đang cập nhật")
    },
    {
      label: "Mức hài lòng trung bình",
      value: metrics.averageRating > 0 ? `${metrics.averageRating.toFixed(1)}/5` : "4.9/5"
    },
    {
      label: "Hỗ trợ phản hồi",
      value: metrics.openTickets > 0 ? String(metrics.openTickets) : "24/7"
    }
  ];

  const heroHighlights = [
    {
      title: "Danh mục dịch vụ rõ ràng",
      description:
        "VPS, cloud server, cloud gaming và gift card được phân loại để người dùng tìm đúng dịch vụ nhanh hơn.",
      icon: faServer
    },
    {
      title: "Mua dịch vụ nhanh chóng",
      description:
        "Quy trình từ chọn sản phẩm đến thanh toán được tối giản để hoàn tất đơn hàng chỉ trong vài bước.",
      icon: faArrowRight
    },
    {
      title: "Theo dõi đơn và mã dịch vụ dễ dàng",
      description:
        "Mã gift card, thông tin VPS và trạng thái đơn được hiển thị rõ ràng trong trang cá nhân.",
      icon: faGift
    },
    {
      title: "Phù hợp với người dùng Việt",
      description:
        "Danh mục và luồng mua được xây dựng theo nhu cầu phổ biến của người dùng Việt Nam.",
      icon: faShieldHalved
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionReveal>
        <section>
          <SectionBox tone="hero" className="rounded-[36px] px-6 py-10 md:px-10 md:py-14">
            <div className="absolute -left-8 top-8 hidden h-40 w-40 rounded-full bg-pink-200/40 blur-3xl animate-glow lg:block" />
            <div className="absolute bottom-6 right-12 hidden h-36 w-36 rounded-full bg-blue-200/40 blur-3xl animate-glow lg:block" />
            <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <span className="inline-flex rounded-full bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                  Marketplace dịch vụ số
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-black leading-tight text-ink md:text-6xl">
                    Sàn dịch vụ số dành cho người dùng Việt
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                    Tìm và mua VPS, cloud server, cloud gaming, gift card và thẻ game trong một
                    marketplace rõ ràng, thân thiện và dễ theo dõi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button href="/marketplace">Bắt đầu</Button>
                  <Button href="/marketplace" variant="outline">
                    Khám phá
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-white/80 bg-white/78 p-4 backdrop-blur md:p-5">
                  <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white/80 to-white/45">
                    <Image
                      src="/images/illustrations/hero-marketplace.svg"
                      alt="Minh họa marketplace dịch vụ số với VPS, cloud, gift card và tay cầm game"
                      width={640}
                      height={480}
                      className="h-auto w-full"
                      priority
                    />
                  </div>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                  {heroHighlights.map((item, index) => (
                    <Card
                      key={item.title}
                      className={`border-white/80 bg-white/80 backdrop-blur transition hover:-translate-y-1 hover:shadow-premium ${index % 2 === 0 ? "md:-translate-y-2" : ""}`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100 text-primary">
                        <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-xl font-bold text-ink">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section>
          <SectionBox>
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Dịch vụ chính"
                title="Các dịch vụ chính tại MeowMarket"
                description="Chọn nhanh nhóm dịch vụ phù hợp rồi tiếp tục vào marketplace để xem sản phẩm, giá bán và thông tin chi tiết."
              />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {primaryServices.map((service) => (
                  <Card
                    key={service.title}
                    className="group flex h-full flex-col justify-between transition hover:-translate-y-1 hover:shadow-premium"
                  >
                    <div>
                      <div className="relative overflow-hidden rounded-[24px] border border-rose-100 bg-gradient-to-br from-[#fff7fb] to-[#f3f7ff]">
                        <Image
                          src={service.image}
                          alt={service.imageAlt}
                          width={320}
                          height={220}
                          className="h-auto w-full transition duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-[16px] bg-white/90 text-primary shadow-sm">
                          <FontAwesomeIcon icon={service.icon} className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="mt-5 text-xl font-bold text-ink">{service.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted">{service.description}</p>
                    </div>
                    <div className="mt-6">
                      <Button href="/marketplace" variant="outline" className="w-full justify-center">
                        Vào marketplace
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section>
          <SectionBox tone="soft">
            <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
              <div className="space-y-6">
                <SectionHeading
                  eyebrow="Lý do chọn MeowMarket"
                  title="Marketplace dịch vụ số được tổ chức rõ ràng"
                  description="Từ tìm kiếm sản phẩm đến thanh toán và theo dõi đơn, mọi bước đều hướng đến việc giúp người dùng mua dịch vụ nhanh và thuận tiện hơn."
                />
                <div className="space-y-4">
                  {reasons.map((reason) => (
                    <div
                      key={reason.title}
                      className="flex gap-4 rounded-[24px] border border-white/70 bg-white/80 p-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-rose-100 text-primary">
                        <FontAwesomeIcon icon={reason.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-ink">{reason.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted">{reason.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <SectionBox tone="dark" className="rounded-[28px] px-6 py-7 md:px-8 md:py-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_0.94fr] lg:items-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-200">
                      Ưu đãi nổi bật
                    </p>
                    <h3 className="mt-4 text-3xl font-black leading-tight">
                      MeowMarket giúp người dùng mua dịch vụ số nhanh hơn và theo dõi đơn dễ hơn.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      Tập trung vào sản phẩm, nhu cầu sử dụng và sự thuận tiện khi mua hàng, thay vì
                      làm người dùng mất thời gian tìm đúng dịch vụ.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {[
                        "Danh mục dịch vụ rõ ràng",
                        "Thanh toán nhanh chóng",
                        "Theo dõi đơn hàng minh bạch",
                        "Nhận mã dịch vụ ngay sau khi mua"
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <Button href="/marketplace">Mua ngay</Button>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10">
                    <Image
                      src="/images/illustrations/promotion-banner.svg"
                      alt="Minh họa banner khuyến mãi cho dịch vụ số và gift card"
                      width={560}
                      height={320}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </SectionBox>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section>
          <SectionBox>
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Cách hoạt động"
                title="Mua dịch vụ số chỉ trong vài bước rõ ràng"
                description="MeowMarket giúp người dùng đi từ nhu cầu đến đơn hàng hoàn tất với quy trình ngắn gọn, dễ hiểu và thuận tiện để theo dõi."
              />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => (
                  <Card key={step.title} className="relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-4xl font-black text-rose-100">
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-blue-100 text-secondary">
                      <FontAwesomeIcon icon={step.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-ink">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{step.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section>
          <SectionBox>
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Niềm tin"
                title="Những tín hiệu giúp người dùng yên tâm trước khi mua"
                description="Xem chỉ số, đánh giá khách hàng và các đối tác thanh toán hoặc nền tảng phổ biến trước khi đi vào marketplace."
              />
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {trustStats.map((stat) => (
                      <Card key={stat.label}>
                        <p className="text-sm text-muted">{stat.label}</p>
                        <p className="mt-3 text-3xl font-black text-ink">{stat.value}</p>
                      </Card>
                    ))}
                  </div>
                  <Card className="bg-gradient-to-br from-[#fff5f8] to-[#f3f7ff]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                          Đối tác & nền tảng
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {["VNPay", "MoMo", "ZaloPay", "Steam", "Google Play", "Garena"].map(
                            (partner) => (
                              <div
                                key={partner}
                                className="flex min-h-24 items-center justify-center rounded-[22px] border border-white/80 bg-white/80 px-4 text-center text-sm font-semibold text-ink"
                              >
                                {partner}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="lg:w-[240px]">
                        <Image
                          src="/images/illustrations/promotion-cloud.svg"
                          alt="Minh họa cloud services promotion"
                          width={560}
                          height={320}
                          className="h-auto w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-1">
                  {trustReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section>
          <SectionBox tone="dark" className="rounded-[36px] px-6 py-10 md:px-10 md:py-12">
            <div className="absolute -right-10 top-1/2 hidden h-52 w-52 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl lg:block" />
            <div className="absolute left-10 top-8 hidden h-24 w-24 rounded-full bg-secondary/20 blur-3xl lg:block" />
            <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-200">
                  CTA cuối trang
                </p>
                <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                  Khám phá MeowMarket và bắt đầu mua dịch vụ số dễ dàng hơn
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Tìm VPS, cloud server, cloud gaming, gift card và thẻ game trong một marketplace
                  rõ ràng, dễ dùng và dễ theo dõi.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button href="/marketplace">Khám phá marketplace</Button>
                  <Button
                    href="/marketplace"
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:border-white hover:text-white"
                  >
                    Bắt đầu mua dịch vụ
                  </Button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                <Image
                  src="/images/illustrations/cta-marketplace.svg"
                  alt="Minh họa marketplace dịch vụ số cho khối kêu gọi hành động"
                  width={560}
                  height={320}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </SectionBox>
        </section>
      </SectionReveal>
    </div>
  );
}
