import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-36 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="size-1.5 rounded-full bg-foreground inline-block" />
              <span className="text-muted-foreground">Marketplace dịch vụ số hàng đầu Việt Nam</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
            Mua dịch vụ số.{" "}
            <span className="text-muted-foreground">Tức thì.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto text-pretty">
            Nền tảng marketplace kỹ thuật số toàn diện — VPS, Cloud Server, Game Card, Giftcard, SIM số và dịch vụ viễn thông Viettel, Vinaphone, Mobifone. Kích hoạt ngay tức thì, thanh toán an toàn.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="px-8 text-base h-12" asChild>
              <Link href="/dashboard">
                Bắt đầu ngay
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 text-base h-12" asChild>
              <Link href="/services">
                <ShoppingBag className="mr-2 size-4" />
                Xem dịch vụ
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-px lg:grid-cols-4 border border-border rounded-xl overflow-hidden bg-border">
          {[
            { stat: "50,000+", label: "Khách hàng tin dùng" },
            { stat: "99.9%", label: "Uptime đảm bảo" },
            { stat: "< 30 giây", label: "Kích hoạt tức thì" },
            { stat: "24/7", label: "Hỗ trợ kỹ thuật" },
          ].map((item) => (
            <div key={item.label} className="bg-background px-8 py-8 text-center">
              <div className="text-2xl font-bold lg:text-3xl">{item.stat}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
