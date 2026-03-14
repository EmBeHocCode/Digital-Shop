import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/dashboard/table";
import { getSupportTickets } from "@/services/ticket-service";
import { formatDate } from "@/utils/format";

export default async function AdminTicketsRoute() {
  const tickets = await getSupportTickets();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Phiếu hỗ trợ</h1>
      <Table
        headers={["Tiêu đề", "Danh mục", "Ngày", "Trạng thái"]}
        rows={tickets.map((ticket) => [
          ticket.subject,
          ticket.category,
          formatDate(ticket.createdAt),
          <Badge key={ticket.id} label={ticket.status} status={ticket.status} />
        ])}
      />
    </div>
  );
}
