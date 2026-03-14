import { NextResponse } from "next/server";
import { accountSettingsSchema } from "@/lib/validators";
import { serializeSessionUser } from "@/services/auth-service";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { updateUserProfile } from "@/services/user-service";

export async function PATCH(request: Request) {
  try {
    const sessionUser = await getCurrentSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Bạn cần đăng nhập lại để cập nhật tài khoản." },
        { status: 401 }
      );
    }

    const parsed = accountSettingsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "Dữ liệu cập nhật chưa hợp lệ."
        },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(sessionUser.id, parsed.data);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy tài khoản để cập nhật." },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Thông tin tài khoản đã được cập nhật.",
      user: updatedUser
    });

    response.cookies.set("meowmarket-user", serializeSessionUser(updatedUser), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    console.error("[profile/account] Update profile failed", error);

    return NextResponse.json(
      { success: false, message: "Không thể cập nhật thông tin tài khoản lúc này." },
      { status: 500 }
    );
  }
}
