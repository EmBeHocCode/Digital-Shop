import { NextResponse } from "next/server";
import { MediaUsageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { acceptedAvatarMimeTypes, maxUploadSizeInBytes } from "@/constants/media";
import { serializeSessionUser } from "@/services/auth-service";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { mapPrismaUser } from "@/services/sql-mappers";
import { deleteLocalUpload, saveUploadedImageLocally } from "@/services/upload/media-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Bạn cần đăng nhập để cập nhật ảnh đại diện." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const avatarFile = formData.get("avatar");

  if (!(avatarFile instanceof File)) {
    return NextResponse.json(
      { success: false, message: "Không tìm thấy file ảnh đại diện hợp lệ." },
      { status: 400 }
    );
  }

  if (!acceptedAvatarMimeTypes.includes(avatarFile.type)) {
    return NextResponse.json(
      { success: false, message: "Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP cho avatar." },
      { status: 400 }
    );
  }

  if (avatarFile.size > maxUploadSizeInBytes) {
    return NextResponse.json(
      { success: false, message: "Ảnh tải lên vượt quá giới hạn dung lượng cho phép." },
      { status: 400 }
    );
  }

  const currentUserRecord = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!currentUserRecord) {
    return NextResponse.json(
      { success: false, message: "Không tìm thấy tài khoản để cập nhật avatar." },
      { status: 404 }
    );
  }

  const savedFile = await saveUploadedImageLocally(avatarFile, "avatars", currentUserRecord.id);

  const updatedUserRecord = await prisma.$transaction(async (transaction) => {
    const mediaAsset = await transaction.mediaAsset.create({
      data: {
        fileName: savedFile.fileName,
        fileUrl: savedFile.fileUrl,
        altText: `Ảnh đại diện ${currentUserRecord.fullName}`,
        uploadedBy: currentUserRecord.id,
        fileType: savedFile.fileType,
        size: savedFile.size,
        usageType: MediaUsageType.AVATAR,
        driver: "LOCAL"
      }
    });

    const updatedUser = await transaction.user.update({
      where: { id: currentUserRecord.id },
      data: {
        avatarUrl: mediaAsset.fileUrl
      }
    });

    await transaction.auditLog.create({
      data: {
        actorId: currentUserRecord.id,
        action: "UPDATE_AVATAR",
        resource: "User",
        resourceId: currentUserRecord.id,
        detail: `Người dùng đã cập nhật ảnh đại diện mới: ${mediaAsset.fileName}.`
      }
    });

    return updatedUser;
  });

  if (
    currentUserRecord.avatarUrl &&
    currentUserRecord.avatarUrl.startsWith("/uploads-temp/avatars/") &&
    currentUserRecord.avatarUrl !== updatedUserRecord.avatarUrl
  ) {
    await deleteLocalUpload(currentUserRecord.avatarUrl);
  }

  const mappedUser = mapPrismaUser(updatedUserRecord);
  const response = NextResponse.json({
    success: true,
    message: "Ảnh đại diện đã được cập nhật.",
    user: mappedUser
  });

  response.cookies.set("meowmarket-user", serializeSessionUser(mappedUser), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
