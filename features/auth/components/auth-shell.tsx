import type { ReactNode } from "react"
import Link from "next/link"
import { ShieldCheck, Sparkles, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AuthShellProps {
  title: string
  description: string
  alternateHref: string
  alternateLabel: string
  alternateText: string
  children: ReactNode
}

const authHighlights = [
  {
    title: "Tài khoản an toàn",
    description: "Luồng đăng nhập và đăng ký đã được nối với Auth.js và Prisma.",
    icon: ShieldCheck,
  },
  {
    title: "Ví khởi tạo tự động",
    description: "Mỗi tài khoản mới được tạo sẵn ví để sẵn sàng cho các phase thanh toán sau.",
    icon: Wallet,
  },
  {
    title: "Sẵn sàng cho checkout",
    description: "Phase 3 kết nối auth với cart, checkout và dashboard mà không phá web hiện tại.",
    icon: Sparkles,
  },
]

export function AuthShell({
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  children,
}: AuthShellProps) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_440px]">
      <section className="space-y-8">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Phase 3
          </p>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {alternateText}{" "}
            <Link
              href={alternateHref}
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground/80"
            >
              {alternateLabel}
            </Link>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {authHighlights.map((item) => (
            <Card key={item.title} className="border-border/80 bg-card/70 backdrop-blur">
              <CardContent className="space-y-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/60 text-foreground">
                  <item.icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>{children}</section>
    </div>
  )
}
