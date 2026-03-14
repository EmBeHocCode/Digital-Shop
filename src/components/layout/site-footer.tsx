import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/ui/card";

const footerGroups = [
  {
    title: "Danh mục dịch vụ",
    links: [
      { label: "VPS", href: "/products?type=VPS" },
      { label: "Cloud", href: "/products?type=CLOUD" },
      { label: "Gift Card", href: "/products?type=GIFTCARD" },
      { label: "Thẻ Game", href: "/products?type=GAMECARD" }
    ]
  },
  {
    title: "Chính sách",
    links: [
      { label: "Điều khoản", href: "/policies" },
      { label: "Bảo mật", href: "/policies#bao-mat" },
      { label: "Hoàn tiền", href: "/policies#hoan-tien" }
    ]
  },
  {
    title: "Liên hệ",
    links: [
      { label: siteConfig.contactEmail, href: "/contact" },
      { label: siteConfig.hotline, href: "/contact" },
      { label: "Phiếu hỗ trợ", href: "/support" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="pb-8">
      <Card className="rounded-[36px] bg-ink text-white">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">MeowMarket</h3>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              Sàn dịch vụ số cho người dùng Việt với trải nghiệm mua hàng rõ ràng, hiện đại và
              đáng tin cậy.
            </p>
            <div className="flex gap-3 text-sm text-slate-300">
              {siteConfig.socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition hover:after:scale-x-100"
                >
                  {social.label}
                </Link>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Bản tin ưu đãi</p>
              <div className="flex gap-3">
                <input
                  placeholder="Nhập email nhận ưu đãi"
                  className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                />
                <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-base font-semibold">{group.title}</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block transition hover:translate-x-1 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-white">Phương thức thanh toán</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
              {["VNPay", "MoMo", "ZaloPay", "Tiền mã hóa"].map((payment) => (
                <span key={payment} className="rounded-full border border-white/10 px-3 py-2">
                  {payment}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Liên kết nhanh</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
              {["Tra cứu đơn", "Giới thiệu", "Khuyến mãi", "Hỗ trợ"].map((link) => (
                <span key={link} className="rounded-full border border-white/10 px-3 py-2">
                  {link}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
          Bản quyền {new Date().getFullYear()} MeowMarket. Mọi quyền được bảo lưu.
        </div>
      </Card>
    </footer>
  );
}
