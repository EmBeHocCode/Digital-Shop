import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import {
  createSqlModelRecord,
  deleteSqlModelRecord,
  getSqlModelRecordById,
  getSqlModelRecords,
  updateSqlModelRecord
} from "@/services/admin/sql-manager-service";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi khi thao tác với cơ sở dữ liệu.";
}

async function ensureAdmin() {
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Bạn không có quyền truy cập trình quản lý SQL." },
      { status: 403 }
    );
  }

  return null;
}

export async function GET(request: Request) {
  const forbidden = await ensureAdmin();
  if (forbidden) {
    return forbidden;
  }

  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get("model");
    const id = searchParams.get("id");

    if (!model) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số model." },
        { status: 400 }
      );
    }

    if (id) {
      const record = await getSqlModelRecordById(model, id);

      return NextResponse.json({
        success: true,
        record
      });
    }

    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 10);
    const query = searchParams.get("query") ?? "";

    const records = await getSqlModelRecords({
      modelName: model,
      page,
      pageSize,
      query
    });

    return NextResponse.json({
      success: true,
      ...records
    });
  } catch (error) {
    console.error("[admin/sql/records] Failed to load records", error);

    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const forbidden = await ensureAdmin();
  if (forbidden) {
    return forbidden;
  }

  try {
    const body = (await request.json()) as {
      model?: string;
      data?: Record<string, unknown>;
    };

    if (!body.model || !body.data) {
      return NextResponse.json(
        { success: false, message: "Thiếu model hoặc dữ liệu tạo mới." },
        { status: 400 }
      );
    }

    const record = await createSqlModelRecord(body.model, body.data);

    return NextResponse.json({
      success: true,
      message: "Đã tạo bản ghi mới thành công.",
      record
    });
  } catch (error) {
    console.error("[admin/sql/records] Failed to create record", error);

    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const forbidden = await ensureAdmin();
  if (forbidden) {
    return forbidden;
  }

  try {
    const body = (await request.json()) as {
      model?: string;
      id?: string;
      data?: Record<string, unknown>;
    };

    if (!body.model || !body.id || !body.data) {
      return NextResponse.json(
        { success: false, message: "Thiếu model, id hoặc dữ liệu cập nhật." },
        { status: 400 }
      );
    }

    const record = await updateSqlModelRecord(body.model, body.id, body.data);

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật bản ghi.",
      record
    });
  } catch (error) {
    console.error("[admin/sql/records] Failed to update record", error);

    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const forbidden = await ensureAdmin();
  if (forbidden) {
    return forbidden;
  }

  try {
    const body = (await request.json()) as {
      model?: string;
      id?: string;
    };

    if (!body.model || !body.id) {
      return NextResponse.json(
        { success: false, message: "Thiếu model hoặc id bản ghi cần xóa." },
        { status: 400 }
      );
    }

    await deleteSqlModelRecord(body.model, body.id);

    return NextResponse.json({
      success: true,
      message: "Đã xóa bản ghi."
    });
  } catch (error) {
    console.error("[admin/sql/records] Failed to delete record", error);

    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
