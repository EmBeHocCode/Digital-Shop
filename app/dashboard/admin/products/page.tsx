import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminProductEditorDialog } from "@/features/admin/components/admin-product-editor-dialog"
import { AdminSummaryCard } from "@/features/admin/components/admin-summary-card"
import { getAdminProducts } from "@/features/admin/services/get-admin-products"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getDomainPresentation,
  getProductStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getAuthSession } from "@/lib/auth"
import { canManageProducts } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminProductsPageProps {
  searchParams: Promise<{
    search?: string
    domain?: string
    status?: string
    page?: string
  }>
}

const domains = ["ALL", "INFRASTRUCTURE", "DIGITAL_GOODS", "TELECOM"] as const
const statuses = ["ALL", "DRAFT", "ACTIVE", "ARCHIVED"] as const

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/dashboard/admin/products?${query}` : "/dashboard/admin/products"
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const session = await getAuthSession()

  if (!canManageProducts(session?.user?.role)) {
    redirect("/access-denied")
  }

  const resolvedSearchParams = await searchParams
  const currentSearch = resolvedSearchParams.search?.trim() || undefined
  const currentDomain = domains.includes((resolvedSearchParams.domain ?? "ALL") as (typeof domains)[number])
    ? (resolvedSearchParams.domain ?? "ALL")
    : "ALL"
  const currentStatus = statuses.includes((resolvedSearchParams.status ?? "ALL") as (typeof statuses)[number])
    ? (resolvedSearchParams.status ?? "ALL")
    : "ALL"
  const currentPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1

  const result = await getAdminProducts({
    search: currentSearch,
    domain: currentDomain as (typeof domains)[number],
    status: currentStatus as (typeof statuses)[number],
    page: currentPage,
  })

  const baseQuery = {
    search: currentSearch,
    domain: currentDomain === "ALL" ? undefined : currentDomain,
    status: currentStatus === "ALL" ? undefined : currentStatus,
  }
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize))

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={
          <>
            <AdminProductEditorDialog mode="create" />
            <Button asChild variant="outline">
              <Link href="/dashboard/admin">Về admin hub</Link>
            </Button>
          </>
        }
        description="Vận hành catalog storefront, kiểm soát trạng thái publish, pricing foundation và các product domain đang bán."
        eyebrow="Admin / catalog ops"
        title="Products management"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard description="Tổng số product trong schema chính." label="Tổng sản phẩm" value={result.summary.total} />
        <AdminSummaryCard description="Product đang active trên storefront." label="Active" value={result.summary.active} />
        <AdminSummaryCard description="Nhóm nháp đang chờ hoàn thiện trước khi publish." label="Draft" value={result.summary.draft} />
        <AdminSummaryCard description="Sản phẩm đang được đánh dấu featured." label="Featured" value={result.summary.featured} />
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardContent className="grid gap-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <form action="/dashboard/admin/products" className="flex w-full flex-col gap-3 md:flex-row xl:max-w-xl">
              <Input defaultValue={currentSearch} name="search" placeholder="Tìm theo tên, slug, category..." />
              {currentDomain !== "ALL" ? <input name="domain" type="hidden" value={currentDomain} /> : null}
              {currentStatus !== "ALL" ? <input name="status" type="hidden" value={currentStatus} /> : null}
              <Button type="submit">Tìm kiếm</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <Button
                  key={domain}
                  asChild
                  size="sm"
                  variant={currentDomain === domain ? "default" : "outline"}
                >
                  <Link href={buildHref(baseQuery, { domain: domain === "ALL" ? undefined : domain, page: undefined })}>
                    {domain}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Button
                key={status}
                asChild
                size="sm"
                variant={currentStatus === status ? "default" : "outline"}
              >
                <Link href={buildHref(baseQuery, { status: status === "ALL" ? undefined : status, page: undefined })}>
                  {status}
                </Link>
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Domain / trạng thái</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Config summary</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length > 0 ? (
                result.items.map((product) => {
                  const domain = getDomainPresentation(product.domain)
                  const status = getProductStatusPresentation(product.status)

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{product.name}</p>
                            {product.isFeatured ? <DetailStatusBadge label="Featured" tone="violet" /> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{product.slug}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                          {product.tagline ? <p className="text-xs text-muted-foreground">{product.tagline}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          <DetailStatusBadge className={domain.tone} label={domain.label} />
                          <DetailStatusBadge label={status.label} tone={status.tone} />
                        </div>
                      </TableCell>
                      <TableCell className="align-top font-semibold">{product.priceLabel}</TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {product.optionGroupCount} option groups • {product.denominationCount} denominations • {product.inventoryCount} inventory
                      </TableCell>
                      <TableCell className="align-top">{product.sortOrder}</TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatDateTime(product.updatedAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminProductEditorDialog mode="edit" product={product} />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
                    Không có sản phẩm phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {result.page}/{totalPages} • hiển thị {result.items.length}/{result.totalCount} sản phẩm
            </p>
            <div className="flex gap-2">
              <Button asChild disabled={result.page <= 1} size="sm" variant="outline">
                <Link href={buildHref(baseQuery, { page: result.page > 1 ? `${result.page - 1}` : undefined })}>
                  Trước
                </Link>
              </Button>
              <Button asChild disabled={result.page >= totalPages} size="sm" variant="outline">
                <Link href={buildHref(baseQuery, { page: result.page < totalPages ? `${result.page + 1}` : undefined })}>
                  Sau
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
