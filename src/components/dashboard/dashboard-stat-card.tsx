import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Card } from "@/components/ui/card";

export function DashboardStatCard({
  title,
  value,
  helper,
  icon
}: {
  title: string;
  value: string;
  helper: string;
  icon: IconDefinition;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        <p className="mt-3 text-3xl font-black text-ink">{value}</p>
        <p className="mt-2 text-sm text-muted">{helper}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-pink-100 text-primary">
        <FontAwesomeIcon icon={icon} className="h-5 w-5" />
      </div>
    </Card>
  );
}
