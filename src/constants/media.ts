export const acceptedImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml"
];

export const acceptedAvatarMimeTypes = acceptedImageMimeTypes.filter(
  (mimeType) => mimeType !== "image/svg+xml"
);

export const maxUploadSizeInBytes = 5 * 1024 * 1024;

export const mediaUsageOptions = [
  "LOGO",
  "BANNER",
  "PRODUCT_IMAGE",
  "CATEGORY_ICON",
  "AVATAR",
  "PAYMENT_ICON",
  "PLACEHOLDER"
] as const;
