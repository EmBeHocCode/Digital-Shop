import { z } from "zod"

const authCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
  password: z
    .string()
    .min(8, "Mật khẩu cần tối thiểu 8 ký tự.")
    .max(72, "Mật khẩu quá dài."),
})

export const signInSchema = authCredentialsSchema.extend({
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

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
})

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Liên kết xác minh không hợp lệ."),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Liên kết đặt lại mật khẩu không hợp lệ."),
    password: z
      .string()
      .min(8, "Mật khẩu cần tối thiểu 8 ký tự.")
      .max(72, "Mật khẩu quá dài."),
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
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
