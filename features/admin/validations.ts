import { ProductDomain, ProductStatus, UserRole } from "@prisma/client"
import { z } from "zod"

const amountSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replaceAll(",", "").trim()
    if (!normalized) return undefined
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}, z.number().finite())

export const adminOrderActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark-reviewed"),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("set-status"),
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED"]),
    paymentStatus: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("request-refund"),
    amount: amountSchema.optional(),
    reason: z.string().trim().min(8).max(500).default("Manual admin refund request"),
  }),
])

export const adminUserUpdateSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Không có thay đổi nào được gửi lên.",
  })

export const adminWalletAdjustmentSchema = z.object({
  walletId: z.string().uuid(),
  amount: amountSchema.refine((value) => value !== 0, {
    message: "Số tiền điều chỉnh phải khác 0.",
  }),
  description: z.string().trim().min(8).max(200),
})

export const adminWalletTransactionReviewSchema = z.object({
  action: z.enum(["approve", "reject", "cancel"]),
  note: z.string().trim().max(500).optional(),
})

const productBaseSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được gồm chữ thường, số và dấu gạch ngang."),
  tagline: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  price: amountSchema.refine((value) => value >= 0, {
    message: "Giá phải lớn hơn hoặc bằng 0.",
  }),
  priceLabel: z.string().trim().max(60).nullable().optional(),
  currency: z.string().trim().length(3).default("VND"),
  domain: z.nativeEnum(ProductDomain),
  category: z.string().trim().min(2).max(80),
  status: z.nativeEnum(ProductStatus),
  imageUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

export const adminCreateProductSchema = productBaseSchema
export const adminUpdateProductSchema = productBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Không có thay đổi nào được gửi lên." }
)

export type AdminOrderActionInput = z.infer<typeof adminOrderActionSchema>
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>
export type AdminWalletAdjustmentInput = z.infer<typeof adminWalletAdjustmentSchema>
export type AdminWalletTransactionReviewInput = z.infer<typeof adminWalletTransactionReviewSchema>
export type AdminCreateProductInput = z.infer<typeof adminCreateProductSchema>
export type AdminUpdateProductInput = z.infer<typeof adminUpdateProductSchema>
