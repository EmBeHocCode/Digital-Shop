import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { getNotificationFeed } from "@/services/notification-service";

export async function GET() {
  const user = await getCurrentSessionUser();
  const notifications = await getNotificationFeed(user?.id, 20);

  return NextResponse.json({ notifications });
}
