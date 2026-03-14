import { AuditLogList } from "@/components/shared/audit-log-list";
import { getAuditLogs } from "@/services/content-service";

export default async function AdminAuditLogRoute() {
  const auditLogs = await getAuditLogs();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Nhật ký hệ thống</h1>
      <AuditLogList items={auditLogs} />
    </div>
  );
}
