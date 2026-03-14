import { NextResponse } from "next/server";
import { registerCredentials } from "@/services/auth/credentials-auth-service";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await registerCredentials({
    fullName: body.fullName as string,
    email: body.email as string,
    phone: body.phone as string,
    password: body.password as string,
    role: "USER"
  });

  if ("error" in result) {
    return NextResponse.json(
      { success: false, message: result.error },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    user: result.user
  });
}
