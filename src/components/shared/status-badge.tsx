import { Badge } from "@/components/ui/badge";
import {
  giftCardStatusMap,
  notificationLevelMap,
  orderStatusMap,
  paymentStatusMap,
  ticketStatusMap,
  userStatusMap,
  vpsStatusMap
} from "@/constants/status";

const toneClasses: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  muted: "bg-slate-200 text-slate-700"
};

const mergedMap = {
  ...orderStatusMap,
  ...paymentStatusMap,
  ...ticketStatusMap,
  ...vpsStatusMap,
  ...giftCardStatusMap,
  ...userStatusMap,
  ...notificationLevelMap
} as Record<string, { label: string; tone: string }>;

export function StatusBadge({ status }: { status: string }) {
  const mapped = mergedMap[status] ?? { label: status, tone: "muted" };
  return (
    <Badge
      label={mapped.label}
      className={toneClasses[mapped.tone] ?? toneClasses.muted}
    />
  );
}
