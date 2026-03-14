import crypto from "node:crypto";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { acceptedImageMimeTypes, maxUploadSizeInBytes } from "@/constants/media";
import type { MediaAsset } from "@/types/domain";

export function validateFileType(fileType: string) {
  return acceptedImageMimeTypes.includes(fileType);
}

export function validateFileSize(size: number) {
  return size <= maxUploadSizeInBytes;
}

export function generateAltText(fileName: string, usageType: string) {
  return `${usageType.toLowerCase()} ${fileName.replace(/\.[^.]+$/, "")}`;
}

export function uploadFileMock(asset: Omit<MediaAsset, "id" | "createdAt" | "altText">) {
  return {
    id: `media-${Date.now()}`,
    createdAt: new Date().toISOString(),
    altText: generateAltText(asset.fileName, asset.usageType),
    ...asset
  } satisfies MediaAsset;
}

export function deleteFileMock(fileUrl: string) {
  return {
    success: true,
    fileUrl
  };
}

function getFileExtension(file: File) {
  if (file.type === "image/png") {
    return ".png";
  }

  if (file.type === "image/webp") {
    return ".webp";
  }

  if (file.type === "image/jpeg") {
    return ".jpg";
  }

  const originalExtension = path.extname(file.name);
  return originalExtension || ".bin";
}

export async function saveUploadedImageLocally(
  file: File,
  folderName: string,
  filePrefix = "media"
) {
  const sanitizedPrefix = filePrefix.replace(/[^a-zA-Z0-9_-]/g, "-");
  const fileName = `${sanitizedPrefix}-${crypto.randomUUID()}${getFileExtension(file)}`;
  const relativeFolder = path.join("uploads-temp", folderName);
  const targetFolder = path.join(process.cwd(), "public", relativeFolder);

  await mkdir(targetFolder, { recursive: true });
  await writeFile(path.join(targetFolder, fileName), Buffer.from(await file.arrayBuffer()));

  return {
    fileName,
    fileUrl: `/${relativeFolder.replace(/\\/g, "/")}/${fileName}`,
    fileType: file.type,
    size: file.size
  };
}

export async function deleteLocalUpload(fileUrl: string) {
  if (!fileUrl.startsWith("/uploads-temp/")) {
    return;
  }

  const absolutePath = path.join(process.cwd(), "public", fileUrl.replace(/^\/+/, ""));
  await unlink(absolutePath).catch(() => undefined);
}
