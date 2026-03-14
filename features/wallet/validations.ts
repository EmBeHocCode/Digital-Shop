import { z } from "zod"
import { topupPaymentMethodCodes } from "@/features/payment/types"

export const createTopupRequestSchema = z.object({
  amount: z
    .number()
    .int("Số tiền nạp phải là số nguyên.")
    .min(10000, "Số tiền nạp tối thiểu là 10.000đ.")
    .max(50000000, "Số tiền nạp tối đa là 50.000.000đ."),
  paymentMethod: z.enum(topupPaymentMethodCodes),
  note: z
    .string()
    .trim()
    .max(300, "Ghi chú quá dài.")
    .optional()
    .or(z.literal("")),
})

export type CreateTopupRequestInput = z.infer<typeof createTopupRequestSchema>
