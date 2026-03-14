import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentProfileData } from "@/services/profile-service";
import { formatDate } from "@/utils/format";

export default async function ProfileTicketsRoute() {
  const profile = await getCurrentProfileData();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-ink">Phiếu hỗ trợ</h1>
      {profile.tickets.length ? (
        profile.tickets.map((ticket) => (
          <Card key={ticket.id}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-ink">{ticket.subject}</p>
                <p className="mt-2 text-sm text-muted">
                  {ticket.category} • {formatDate(ticket.createdAt)}
                </p>
              </div>
              <Badge label={ticket.status} status={ticket.status} />
            </div>
            <div className="mt-5 space-y-3">
              {ticket.messages.map((message) => (
                <div key={message.id} className="rounded-[20px] bg-rose-50/60 p-4 text-sm text-muted">
                  <p className="font-semibold text-ink">{message.sender}</p>
                  <p className="mt-2 leading-7">{message.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Link href={`/profile/tickets/${ticket.id}`} className="font-semibold text-primary">
                Xem chi tiết phiếu hỗ trợ
              </Link>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState
          title="Chưa có phiếu hỗ trợ"
          description="Khi bạn gửi yêu cầu hỗ trợ, toàn bộ hội thoại sẽ xuất hiện tại đây."
          ctaLabel="Mở trung tâm hỗ trợ"
          ctaLink="/support"
        />
      )}
    </div>
  );
}
