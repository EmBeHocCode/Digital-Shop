import Link from "next/link"
import { Facebook, MessageCircle, Youtube } from "lucide-react"
import { AppLogo } from "@/components/shared/app-logo"
import { publicServiceLinks } from "@/features/catalog/data/catalog-data"

const footerLinks = {
  "Sản phẩm": publicServiceLinks,
  "Hỗ trợ": [
    { name: "Tài liệu hướng dẫn", href: "#" },
    { name: "API Documentation", href: "#" },
    { name: "Trạng thái hệ thống", href: "#" },
    { name: "Liên hệ hỗ trợ", href: "#" },
    { name: "Cộng đồng", href: "#" },
  ],
  "Công ty": [
    { name: "Về chúng tôi", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Đối tác", href: "#" },
    { name: "Chương trình Affiliate", href: "#" },
  ],
  "Pháp lý": [
    { name: "Chính sách bảo mật", href: "#" },
    { name: "Điều khoản dịch vụ", href: "#" },
    { name: "Chính sách hoàn tiền", href: "#" },
    { name: "Cookies", href: "#" },
  ],
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/10">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <AppLogo href="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Nền tảng marketplace dịch vụ số hàng đầu Việt Nam. VPS, Cloud, Game Card, SIM — tất cả trong một nơi.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                <span className="sr-only">Facebook</span>
                <Facebook className="size-5" />
              </Link>
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                <span className="sr-only">YouTube</span>
                <Youtube className="size-5" />
              </Link>
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                <span className="sr-only">Zalo</span>
                <MessageCircle className="size-5" />
              </Link>
            </div>
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Hotline hỗ trợ</p>
              <p className="mt-1 text-sm font-semibold">1800 xxxx (Miễn phí)</p>
              <p className="mt-0.5 text-xs text-muted-foreground">8:00 – 22:00 tất cả các ngày</p>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NexCloud. Bảo lưu mọi quyền. Mã số doanh nghiệp: 0123456789
          </p>
          <div className="flex gap-5">
            <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Chính sách bảo mật
            </Link>
            <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
