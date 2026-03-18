export const avatarUploadConstraints = {
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 3 * 1024 * 1024,
  maxBytesLabel: "3MB",
} as const
