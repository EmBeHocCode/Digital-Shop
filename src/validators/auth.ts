import { z } from "zod";

export const registerCredentialsSchema = z.object({
  fullName: z.string().min(2, "Nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu cần ít nhất 1 ký tự in hoa")
    .regex(/[0-9]/, "Mật khẩu cần ít nhất 1 chữ số"),
  confirmPassword: z.string().min(8, "Nhập lại mật khẩu")
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Xác nhận mật khẩu chưa khớp"
});

export const loginCredentialsSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["USER", "ADMIN"])
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(8, "Token không hợp lệ"),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8, "Nhập lại mật khẩu")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Xác nhận mật khẩu chưa khớp"
  });
