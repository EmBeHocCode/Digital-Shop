import { Table } from "@/components/dashboard/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { getServiceRecords } from "@/services/vps/vps-instance-service";

export default async function AdminServicesRoute() {
  const serviceRecords = await getServiceRecords();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Quản lý dịch vụ VPS / cloud</h1>
      <Table
        headers={["Tên dịch vụ", "Loại", "Người dùng", "Gia hạn", "Trạng thái"]}
        rows={serviceRecords.map((service) => [
          service.serviceName,
          service.type,
          service.userId,
          service.renewAt ?? "-",
          <StatusBadge key={service.id} status={service.status} />
        ])}
      />
    </div>
  );
}
