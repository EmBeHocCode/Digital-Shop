import { Card } from "@/components/ui/card";
import { getSiteSettings } from "@/services/content-service";

export default async function AdminSeoRoute() {
  const siteSettings = await getSiteSettings();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Cài đặt SEO</h1>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Tiêu đề website</p>
          <p className="mt-2 font-semibold text-ink">{siteSettings?.seoTitle}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Mô tả meta</p>
          <p className="mt-2 font-semibold text-ink">{siteSettings?.seoDescription}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Logo</p>
          <p className="mt-2 font-semibold text-ink">{siteSettings?.logoUrl}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Biểu tượng tab</p>
          <p className="mt-2 font-semibold text-ink">{siteSettings?.faviconUrl}</p>
        </Card>
      </div>
    </div>
  );
}
