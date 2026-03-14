"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketSchema } from "@/lib/validators";
import type { TicketFormValues } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SupportTicketForm() {
  const [serverMessage, setServerMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema)
  });

  const onSubmit = async (values: TicketFormValues) => {
    setServerMessage("");

    const response = await fetch("/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setMessageTone("error");
      setServerMessage(payload.message ?? "Không thể tạo phiếu hỗ trợ.");
      return;
    }

    setMessageTone("success");
    setServerMessage("Phiếu hỗ trợ đã được ghi vào cơ sở dữ liệu và xuất hiện trong trang cá nhân.");
  };

  return (
    <Card>
      <h3 className="text-2xl font-bold text-ink">Tạo phiếu hỗ trợ</h3>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("subject")}
          placeholder="Tiêu đề hỗ trợ"
          className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
        />
        {errors.subject ? <p className="text-sm text-rose-500">{errors.subject.message}</p> : null}
        <select
          {...register("category")}
          className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
        >
          <option value="">Chọn danh mục</option>
          <option value="VPS">VPS</option>
          <option value="Cloud">Cloud</option>
          <option value="Gift Card">Gift card</option>
          <option value="Thanh toán">Thanh toán</option>
        </select>
        {errors.category ? <p className="text-sm text-rose-500">{errors.category.message}</p> : null}
        <textarea
          {...register("message")}
          rows={5}
          placeholder="Mô tả chi tiết vấn đề của bạn"
          className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none"
        />
        {errors.message ? <p className="text-sm text-rose-500">{errors.message.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          Gửi phiếu hỗ trợ
        </Button>
        {serverMessage ? (
          <p className={`text-sm ${messageTone === "error" ? "text-rose-500" : "text-emerald-600"}`}>
            {serverMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
