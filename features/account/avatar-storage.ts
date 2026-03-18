import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

const avatarMimeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const avatarUploadDirectory = path.join(process.cwd(), "public", "uploads", "avatars")

export function isSupportedAvatarMimeType(mimeType: string) {
  return mimeType in avatarMimeExtensions
}

export function isManagedAvatarPath(imageUrl: string | null | undefined) {
  return Boolean(imageUrl?.startsWith("/uploads/avatars/"))
}

export async function saveUserAvatar(userId: string, file: File) {
  const extension = avatarMimeExtensions[file.type as keyof typeof avatarMimeExtensions]

  if (!extension) {
    throw new Error("UNSUPPORTED_AVATAR_TYPE")
  }

  await mkdir(avatarUploadDirectory, { recursive: true })

  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, "")
  const fileName = `${safeUserId}-${Date.now()}-${randomUUID()}.${extension}`
  const filePath = path.join(avatarUploadDirectory, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(filePath, buffer)

  return `/uploads/avatars/${fileName}`
}

export async function removeManagedAvatar(imageUrl: string | null | undefined) {
  if (!isManagedAvatarPath(imageUrl)) {
    return
  }

  const fileName = path.basename(imageUrl!)
  const filePath = path.join(avatarUploadDirectory, fileName)

  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error
    }
  })
}
