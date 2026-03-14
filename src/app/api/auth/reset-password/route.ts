import { NextResponse } from "next/server";
import { resetPassword } from "@/services/auth/credentials-auth-service";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await resetPassword(body.token as string, body.password as string);

  if ("error" in result) {
    return NextResponse.json(
      { success: false, message: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    token: body.token,
    updatedAt: new Date().toISOString()
  });
}
