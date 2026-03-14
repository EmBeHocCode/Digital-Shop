import { NextResponse } from "next/server";
import { deleteSession } from "@/services/user-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  await deleteSession((body.sessionToken as string | undefined) ?? "");

  return NextResponse.json({
    success: true
  });
}
