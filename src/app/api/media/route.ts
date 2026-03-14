import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/services/auth/server-session-service";
import { getMediaAssets } from "@/services/content-service";
import { deleteFileMock, uploadFileMock } from "@/services/upload/media-service";

export async function GET() {
  return NextResponse.json({ mediaAssets: await getMediaAssets() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Bạn cần đăng nhập để thêm media." },
      { status: 401 }
    );
  }

  const asset = uploadFileMock({
    fileName: body.fileName as string,
    fileUrl: body.fileUrl as string,
    uploadedBy: body.uploadedBy as string,
    fileType: body.fileType as string,
    size: Number(body.size),
    usageType: body.usageType
  });

  const createdAsset = await prisma.mediaAsset.create({
    data: {
      fileName: asset.fileName,
      fileUrl: asset.fileUrl,
      altText: asset.altText,
      uploadedBy: user.id,
      fileType: asset.fileType,
      size: asset.size,
      usageType: asset.usageType,
      driver: asset.driver ?? "LOCAL"
    }
  });

  return NextResponse.json({
    success: true,
    asset: createdAsset
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("fileUrl") ?? "";

  await prisma.mediaAsset.deleteMany({
    where: { fileUrl }
  });

  return NextResponse.json(deleteFileMock(fileUrl));
}
