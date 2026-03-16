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
import { AdminSummaryCard } from "@/features/admin/components/admin-summary-card"
import { AdminUserActions } from "@/features/admin/components/admin-user-actions"
import { getAdminUsers } from "@/features/admin/services/get-admin-users"
import { DetailStatusBadge } from "@/features/dashboard/components/detail-status-badge"
import {
  getAccountStatePresentation,
  getUserRolePresentation,
  getWalletStatusPresentation,
} from "@/features/dashboard/detail-presenters"
import { getAuthSession } from "@/lib/auth"
import { canManageUsers } from "@/lib/auth/role-helpers"
import { formatDateTime } from "@/lib/utils"

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string
    role?: string
    state?: string
    page?: string
  }>
}

const roles = ["ALL", "CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPERADMIN"] as const
const states = ["ALL", "ACTIVE", "INACTIVE"] as const

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/dashboard/admin/users?${query}` : "/dashboard/admin/users"
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await getAuthSession()

  if (!canManageUsers(session?.user?.role)) {
    redirect("/access-denied")
  }

  const resolvedSearchParams = await searchParams
  const currentSearch = resolvedSearchParams.search?.trim() || undefined
  const currentRole = roles.includes((resolvedSearchParams.role ?? "ALL") as (typeof roles)[number])
    ? (resolvedSearchParams.role ?? "ALL")
    : "ALL"
  const currentState = states.includes((resolvedSearchParams.state ?? "ALL") as (typeof states)[number])
    ? (resolvedSearchParams.state ?? "ALL")
    : "ALL"
  const currentPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1

  const result = await getAdminUsers({
    search: currentSearch,
    role: currentRole as (typeof roles)[number],
    state: currentState as (typeof states)[number],
    page: currentPage,
  })

  const baseQuery = {
    search: currentSearch,
    role: currentRole === "ALL" ? undefined : currentRole,
    state: currentState === "ALL" ? undefined : currentState,
  }

  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize))

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Về admin hub</Link>
          </Button>
        }
        description="Review khách hàng và tài khoản nội bộ, cập nhật role và trạng thái hoạt động ngay trên backoffice."
        eyebrow="Admin / customer ops"
        title="Users & customers"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard description="Tất cả user theo bộ lọc hiện tại." label="Tổng user" value={result.summary.total} />
        <AdminSummaryCard description="Nhóm role khách hàng cuối." label="Customers" value={result.summary.customers} />
        <AdminSummaryCard description="Staff, manager, admin và superadmin." label="Team members" value={result.summary.teamMembers} />
        <AdminSummaryCard description="Số tài khoản chưa active trong hệ thống." label="Inactive" value={result.summary.inactive} />
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardContent className="grid gap-5 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <form action="/dashboard/admin/users" className="flex w-full flex-col gap-3 md:flex-row xl:max-w-xl">
              <Input defaultValue={currentSearch} name="search" placeholder="Tìm theo tên, email, số điện thoại..." />
              {currentRole !== "ALL" ? <input name="role" type="hidden" value={currentRole} /> : null}
              {currentState !== "ALL" ? <input name="state" type="hidden" value={currentState} /> : null}
              <Button type="submit">Tìm kiếm</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Button
                  key={role}
                  asChild
                  size="sm"
                  variant={currentRole === role ? "default" : "outline"}
                >
                  <Link href={buildHref(baseQuery, { role: role === "ALL" ? undefined : role, page: undefined })}>
                    {role}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {states.map((state) => (
              <Button
                key={state}
                asChild
                size="sm"
                variant={currentState === state ? "default" : "outline"}
              >
                <Link href={buildHref(baseQuery, { state: state === "ALL" ? undefined : state, page: undefined })}>
                  {state}
                </Link>
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role / trạng thái</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead className="min-w-[260px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length > 0 ? (
                result.items.map((user) => {
                  const roleStatus = getUserRolePresentation(user.role)
                  const accountState = getAccountStatePresentation(user.isActive)
                  const walletState = user.walletStatus
                    ? getWalletStatusPresentation(user.walletStatus)
                    : null

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.phone ? <p className="text-xs text-muted-foreground">{user.phone}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          <DetailStatusBadge label={roleStatus.label} tone={roleStatus.tone} />
                          <DetailStatusBadge label={accountState.label} tone={accountState.tone} />
                          {walletState ? (
                            <DetailStatusBadge label={walletState.label} tone={walletState.tone} />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="font-medium">{user.walletBalanceLabel}</p>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {user.orderCount} đơn
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/users/${user.id}`}>Chi tiết</Link>
                        </Button>
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminUserActions
                          currentRole={user.role}
                          isActive={user.isActive}
                          isSelf={session?.user?.id === user.id}
                          userId={user.id}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
                    Không có user phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {result.page}/{totalPages} • hiển thị {result.items.length}/{result.totalCount} user
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
