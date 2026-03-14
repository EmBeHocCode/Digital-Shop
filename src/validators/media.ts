import { z } from "zod";
import { acceptedImageMimeTypes, maxUploadSizeInBytes } from "@/constants/media";

export const mediaAssetSchema = z.object({
  fileName: z.string().min(2, "Thiếu tên file"),
  fileType: z.string().refine((type) => acceptedImageMimeTypes.includes(type), {
    message: "Định dạng file không được hỗ trợ"
  }),
  size: z.number().max(maxUploadSizeInBytes, "File vượt quá giới hạn 5MB"),
  usageType: z.enum([
    "LOGO",
    "BANNER",
    "PRODUCT_IMAGE",
    "CATEGORY_ICON",
    "AVATAR",
    "PAYMENT_ICON",
    "PLACEHOLDER"
  ])
});
