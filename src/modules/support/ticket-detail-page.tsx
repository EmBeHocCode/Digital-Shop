import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentUserTicketById } from "@/services/profile-service";

export async function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const ticket = await getCurrentUserTicketById(ticketId);

  if (!ticket) {
    return (
      <EmptyState
        title="Không tìm thấy phiếu hỗ trợ"
        description="Phiếu hỗ trợ này không thuộc tài khoản hiện tại hoặc đã bị xóa."
        ctaLabel="Về danh sách phiếu hỗ trợ"
        ctaLink="/profile/tickets"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Phiếu hỗ trợ</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{ticket.subject}</h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </Card>
      <div className="space-y-4">
        {ticket.messages.map((message) => (
          <Card key={message.id} className={message.sender === "ADMIN" ? "bg-blue-50/60" : "bg-rose-50/60"}>
            <p className="font-semibold text-ink">{message.sender === "ADMIN" ? "Hỗ trợ viên" : "Khách hàng"}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{message.body}</p>
            <p className="mt-3 text-xs text-muted">{message.createdAt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
