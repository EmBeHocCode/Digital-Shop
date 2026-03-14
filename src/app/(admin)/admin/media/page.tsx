import { MediaUploader } from "@/components/admin/media-uploader";
import { ImagePreview } from "@/components/admin/image-preview";
import { getMediaAssets } from "@/services/content-service";

export default async function AdminMediaRoute() {
  const mediaAssets = await getMediaAssets();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-ink">Thư viện media</h1>
      <MediaUploader />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {mediaAssets.map((asset) => (
          <ImagePreview key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}
