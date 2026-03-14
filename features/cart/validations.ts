import { z } from "zod"
import { paymentMethodCodes } from "@/features/payment/types"

export const checkoutSchema = z.object({
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
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
