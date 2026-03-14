import { NextResponse } from "next/server";
import { passwordChangeSchema } from "@/lib/validators";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { changeUserPassword } from "@/services/user-service";

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Bạn cần đăng nhập lại để đổi mật khẩu." },
        { status: 401 }
      );
    }

    const parsed = passwordChangeSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Thông tin mật khẩu chưa hợp lệ."
        },
        { status: 400 }
      );
    }

    const result = await changeUserPassword(
      sessionUser.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    if ("error" in result) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mật khẩu đã được cập nhật."
    });
  } catch (error) {
    console.error("[profile/password] Change password failed", error);

    return NextResponse.json(
      { success: false, message: "Không thể đổi mật khẩu lúc này." },
      { status: 500 }
    );
  }
}
