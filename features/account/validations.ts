import { z } from "zod"

export const updateUserSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên hiển thị cần tối thiểu 2 ký tự.")
    .max(80, "Tên hiển thị quá dài."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{9,20}$/, "Số điện thoại chưa hợp lệ.")
    .optional()
    .or(z.literal("")),
})

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>
