import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { createSupportTicket, getFaqs, getSupportTickets } from "@/services/ticket-service";

export async function GET() {
  return NextResponse.json({
    faqs: await getFaqs(),
    tickets: await getSupportTickets()
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Bạn cần đăng nhập để tạo phiếu hỗ trợ." },
      { status: 401 }
    );
  }

  const ticket = await createSupportTicket({
    userId: user.id,
    subject: body.subject as string,
    category: body.category as string,
    content: body.message as string
  });

  return NextResponse.json({
    success: true,
    ticket
  });
}
