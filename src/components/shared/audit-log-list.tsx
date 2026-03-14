import type { AuditLog } from "@/types/domain";
import { Card } from "@/components/ui/card";

export function AuditLogList({ items }: { items: AuditLog[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">
                {item.actorName} • {item.action}
              </p>
              <p className="mt-1 text-sm text-muted">
                {item.resource} / {item.resourceId}
              </p>
            </div>
            <p className="text-xs text-muted">{item.createdAt}</p>
          </div>
          {item.detail ? <p className="mt-3 text-sm text-muted">{item.detail}</p> : null}
        </Card>
      ))}
    </div>
  );
}
