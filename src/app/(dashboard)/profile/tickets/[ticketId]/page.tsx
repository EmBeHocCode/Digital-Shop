import { TicketDetailPage } from "@/modules/support/ticket-detail-page";

export default async function ProfileTicketDetailRoute({
  params
}: {
  params: { ticketId: string };
}) {
  return <TicketDetailPage ticketId={params.ticketId} />;
}
