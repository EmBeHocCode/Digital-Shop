import type { AiInsight } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export function AIInsightCard({ insight }: { insight: AiInsight }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-ink">{insight.title}</p>
          <p className="mt-2 text-sm text-muted">{insight.description}</p>
        </div>
        <StatusBadge status={insight.status === "WARNING" ? "WARNING" : "INFO"} />
      </div>
      <p className="mt-6 text-3xl font-black text-primary">{insight.value}</p>
    </Card>
  );
}
