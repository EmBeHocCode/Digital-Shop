import type { MediaAsset } from "@/types/domain";
import { Card } from "@/components/ui/card";

export function ImagePreview({ asset }: { asset: MediaAsset }) {
  return (
    <Card className="space-y-4">
      <div className="rounded-[24px] bg-gradient-to-br from-rose-100 via-white to-blue-100 p-6">
        <div className="aspect-[4/3] rounded-[20px] border border-white/80 bg-white/80" />
      </div>
      <div>
        <p className="font-semibold text-ink">{asset.fileName}</p>
        <p className="mt-1 text-sm text-muted">{asset.altText}</p>
      </div>
    </Card>
  );
}
