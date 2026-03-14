import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { getSqlModelMeta, getSqlModelOverviewList } from "@/services/admin/sql-manager-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionUser = await getCurrentSessionUser();

    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Bạn không có quyền truy cập trình quản lý SQL." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedModel = searchParams.get("model");
    const models = await getSqlModelOverviewList();
    const selectedModelName = requestedModel && models.some((model) => model.name === requestedModel)
      ? requestedModel
      : models[0]?.name;

    return NextResponse.json({
      success: true,
      models,
      selectedModel: selectedModelName ? getSqlModelMeta(selectedModelName) : null
    });
  } catch (error) {
    console.error("[admin/sql/models] Failed to load models", error);

    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách bảng dữ liệu lúc này." },
      { status: 500 }
    );
  }
}
