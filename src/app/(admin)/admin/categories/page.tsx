import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { getCategories } from "@/services/product-service";

export default async function AdminCategoriesRoute() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Quản lý danh mục</h1>
      <Table
        headers={["Tên", "Slug", "Hiển thị", "Số mục con"]}
        rows={categories.map((category) => [
          category.name,
          category.slug,
          <Badge key={`${category.id}-visible`} label="Đang hiển thị" />,
          String(category.children?.length ?? 0)
        ])}
      />
    </div>
  );
}
