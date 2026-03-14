import { NextResponse } from "next/server";
import { authenticateCredentials } from "@/services/auth/credentials-auth-service";
import { createUserSession } from "@/services/user-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập đầy đủ email và mật khẩu." },
        { status: 400 }
      );
    }

    const user = await authenticateCredentials(body.email, body.password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email hoặc mật khẩu chưa đúng." },
        { status: 401 }
      );
    }

    const session = await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      user,
      session: {
        token: session.token,
        role: user.role,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error("[auth/login] Login request failed", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Đăng nhập tạm thời không khả dụng. Kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
      },
      { status: 500 }
    );
  }
}
