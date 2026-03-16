import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReceiptText } from "lucide-react"
import { getAuthSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"
import { getUserOrders } from "@/features/orders/services/get-user-orders"
import { getPaymentMethodLabel, getPaymentStatusClassName, getPaymentStatusLabel } from "@/features/payment/utils"

export default async function DashboardOrdersPage() {
  const session = await getAuthSession()
  const orders = await getUserOrders(session?.user?.id ?? "")
  const pendingOrders = orders.filter((order) => order.paymentStatus === "pending").length
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  if (orders.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border bg-card/95">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Chưa có đơn hàng nào</EmptyTitle>
          <EmptyDescription>
            Sau khi hoàn tất checkout, đơn hàng sẽ xuất hiện tại đây cùng với trạng thái thanh toán.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Tổng đơn hàng</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Luồng order backend thật hiện đã gắn đơn hàng vào tài khoản đăng nhập.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Pending payment</CardDescription>
            <CardTitle className="text-2xl">{pendingOrders}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bao gồm đơn đang chờ webhook Stripe, chuyển khoản thủ công hoặc xác nhận thủ công.
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>Tổng chi tiêu</CardDescription>
            <CardTitle className="text-2xl">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(totalSpent)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tổng hợp trên danh sách order hiện có của tài khoản.
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/95 p-4 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tham chiếu</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <p>{order.paymentReference ?? order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.slice(0, 2).map((item) => item.productName).join(" • ")}
                      {order.items.length > 2 ? ` +${order.items.length - 2} item` : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell>
                  <Badge className={getPaymentStatusClassName(order.paymentStatus)} variant="outline">
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{order.status}</Badge>
                </TableCell>
                <TableCell>{getPaymentMethodLabel(order.paymentMethod)}</TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/orders/${order.id}`}>Mở chi tiết</Link>
                  </Button>
                </TableCell>
                <TableCell className="text-right font-semibold">{order.totalAmountLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
