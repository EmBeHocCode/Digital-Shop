import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts } from "@/services/product-service";
import { formatCurrency } from "@/utils/format";

export default async function AdminProductsRoute() {
  const productResult = await getProducts({
    page: 1,
    pageSize: 50,
    sort: "newest"
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Product management</h1>
      {productResult.items.length ? (
        <Table
          headers={["Tên", "Loại", "Giá", "Hot", "Khuyến mãi", "Xuất bản"]}
          rows={productResult.items.map((product) => [
            product.name,
            product.type,
            formatCurrency(product.price),
            <Badge key={`${product.id}-hot`} label={product.isHot ? "Có" : "Không"} />,
            <Badge
              key={`${product.id}-promo`}
              label={product.isPromotion ? "Đang chạy" : "Tắt"}
            />,
            <Badge
              key={`${product.id}-published`}
              label={product.isPublished ? "Đã publish" : "Nháp"}
              status={product.isPublished ? "ACTIVE" : "PENDING"}
            />
          ])}
        />
      ) : (
        <EmptyState
          title="Chưa có sản phẩm trong cơ sở dữ liệu"
          description="Trang quản trị hiện đang đọc bảng Product qua Prisma. Hãy thêm dữ liệu SQL trước khi quản lý sản phẩm."
        />
      )}
    </div>
  );
}
