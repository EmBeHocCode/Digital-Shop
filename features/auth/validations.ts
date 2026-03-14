import { z } from "zod"

const checkboxTrueSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase()
    return normalizedValue === "true" || normalizedValue === "1" || normalizedValue === "on"
  }

  return false
}, z.boolean())

const authCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
  password: z
    .string()
    .min(8, "Mật khẩu cần tối thiểu 8 ký tự.")
    .max(72, "Mật khẩu quá dài."),
})

export const signInSchema = authCredentialsSchema.extend({
  humanCheck: checkboxTrueSchema.refine((value) => value, {
    message: "Vui lòng xác nhận bạn không phải robot.",
  }),
  humanAnswer: z.string().trim().min(1, "Vui lòng nhập kết quả xác thực."),
  humanToken: z.string().trim().min(1, "Mã xác thực không hợp lệ."),
  website: z.string().trim().max(0, "Yêu cầu không hợp lệ.").optional().or(z.literal("")),
})

export const registerSchema = authCredentialsSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(2, "Họ tên cần tối thiểu 2 ký tự.")
      .max(80, "Họ tên quá dài."),
    phone: z
      .string()
      .trim()
      .max(20, "Số điện thoại quá dài.")
      .optional()
      .or(z.literal("")),
    confirmPassword: z
      .string()
      .min(8, "Vui lòng xác nhận mật khẩu.")
      .max(72, "Mật khẩu xác nhận quá dài."),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận chưa khớp.",
      })
    }
  })

export type SignInInput = z.infer<typeof signInSchema>
export type RegisterInput = z.infer<typeof registerSchema>
