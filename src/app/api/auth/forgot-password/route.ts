import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/services/auth/credentials-auth-service";

export async function POST(request: Request) {
  const body = await request.json();
  const resetToken = await requestPasswordReset(body.email as string);

  return NextResponse.json({
    success: true,
    email: body.email,
    token: resetToken?.token ?? null,
    expiresInMinutes: 30,
    message: resetToken
      ? "Đã tạo mã đặt lại mật khẩu trong cơ sở dữ liệu."
      : "Nếu email tồn tại trong hệ thống, mã đặt lại đã được tạo."
  });
}
