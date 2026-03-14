import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ServiceDetail } from "@/features/catalog/components/service-detail"
import {
  getCatalogProductPaths,
  getProductBySlug,
} from "@/features/catalog/services/get-products"

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return getCatalogProductPaths()
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const { item: service } = await getProductBySlug(slug)

  if (!service) {
    return {
      title: "Dịch vụ không tồn tại | NexCloud",
    }
  }

  return {
    title: `${service.name} | NexCloud`,
    description: service.description,
  }
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params
  const { item: service } = await getProductBySlug(slug)

  if (!service) {
    notFound()
  }

  return <ServiceDetail service={service} />
}
