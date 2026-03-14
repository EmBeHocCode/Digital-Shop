import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button"
import { getCartProduct } from "@/features/cart/utils/get-cart-product"
import type { CatalogService } from "@/features/catalog/types"

interface ServiceCardProps {
  service: CatalogService
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="group flex h-full flex-col border-border/80 bg-card/90 transition-all duration-200 hover:border-foreground/25 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted">
            <service.icon className="size-5 text-foreground" />
          </div>
          <Badge variant="outline">{service.category}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl">{service.name}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{service.tagline}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
        <ul className="space-y-2">
          {service.features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary/80" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-4 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Mức giá</p>
          <p className="text-sm font-semibold">{service.price}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <AddToCartButton
            product={getCartProduct(service).product}
            size="sm"
            variant="outline"
          />
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Xem chi tiết
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
