import type { CatalogService } from "@/features/catalog/types"
import { ServiceCard } from "@/features/catalog/components/service-card"

interface CatalogGridProps {
  services: CatalogService[]
}

export function CatalogGrid({ services }: CatalogGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.slug} service={service} />
      ))}
    </div>
  )
}
