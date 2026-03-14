import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
  icon
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-3 text-3xl font-black text-ink">{value}</p>
        {helper ? <p className="mt-2 text-sm text-muted">{helper}</p> : null}
      </div>
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-pink-100 text-primary">
          {icon}
        </div>
      ) : null}
    </Card>
  );
}
