import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { getBanners } from "@/services/content-service";

export default async function AdminBannersRoute() {
  const banners = await getBanners();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Quản lý banner</h1>
      <Table
        headers={["Tiêu đề", "Vị trí", "CTA", "Link"]}
        rows={banners.map((banner) => [
          banner.title,
          <Badge key={banner.id} label={banner.placement} />,
          banner.ctaLabel,
          banner.ctaLink
        ])}
      />
    </div>
  );
}
