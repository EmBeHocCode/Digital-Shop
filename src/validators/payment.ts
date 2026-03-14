import { z } from "zod";

export const paymentIntentSchema = z.object({
  orderCode: z.string().min(4, "Thiếu mã đơn hàng"),
  gateway: z.enum(["VNPAY", "MOMO", "ZALOPAY", "CRYPTO"]),
  amount: z.number().positive("Số tiền không hợp lệ")
});

export const paymentCallbackSchema = z.object({
  transactionCode: z.string().min(4),
  status: z.enum(["SUCCESS", "FAILED"]),
  orderCode: z.string().min(4)
});
