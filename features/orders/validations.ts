import { z } from "zod"
import { purchaseSelectionSchema } from "@/features/catalog/product-purchase"
import { paymentMethodCodes } from "@/features/payment/types"

export const orderLineItemSchema = z.object({
  id: z.string().trim().min(1, "Thiếu mã dòng giỏ hàng.").optional(),
  slug: z.string().trim().min(1, "Thiếu mã sản phẩm."),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0."),
  configuration: purchaseSelectionSchema.optional(),
})

export const createOrderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Họ tên cần tối thiểu 2 ký tự.")
    .max(80, "Họ tên quá dài."),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
  phone: z
    .string()
    .trim()
    .min(9, "Số điện thoại chưa hợp lệ.")
    .max(20, "Số điện thoại quá dài.")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(paymentMethodCodes),
  note: z
    .string()
    .trim()
    .max(300, "Ghi chú quá dài.")
    .optional()
    .or(z.literal("")),
  items: z.array(orderLineItemSchema).min(1, "Giỏ hàng đang trống."),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
