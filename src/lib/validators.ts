import { z } from "zod";

export * from "@/validators";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự")
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(10, "Số điện thoại không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Xác nhận mật khẩu")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Mật khẩu xác nhận chưa khớp",
    path: ["confirmPassword"]
  });

export const accountSettingsSchema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên"),
  phone: z.string().trim().min(10, "Số điện thoại không hợp lệ")
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6, "Nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Nhập lại mật khẩu mới")
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Mật khẩu xác nhận chưa khớp",
    path: ["confirmPassword"]
  });

export const contactSchema = z.object({
  fullName: z.string().min(2, "Nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  message: z.string().min(10, "Tin nhắn quá ngắn")
});

export const ticketSchema = z.object({
  subject: z.string().min(4, "Nhập tiêu đề phiếu hỗ trợ"),
  category: z.string().min(2, "Chọn danh mục"),
  message: z.string().min(10, "Mô tả chi tiết hơn")
});

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  paymentMethod: z.enum(["VNPAY", "MOMO", "ZALOPAY", "CRYPTO"]),
  note: z.string().optional()
});

export const orderLookupSchema = z.object({
  orderCode: z.string().min(5, "Nhập mã đơn hàng")
});
