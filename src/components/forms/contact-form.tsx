"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validators";
import type { ContactFormValues } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async () => {
    setSubmitted(true);
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-ink">Gửi liên hệ</h2>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("fullName")} placeholder="Họ và tên" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.fullName ? <p className="text-sm text-rose-500">{errors.fullName.message}</p> : null}
        <input {...register("email")} placeholder="Email" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.email ? <p className="text-sm text-rose-500">{errors.email.message}</p> : null}
        <input {...register("phone")} placeholder="Số điện thoại" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.phone ? <p className="text-sm text-rose-500">{errors.phone.message}</p> : null}
        <textarea {...register("message")} rows={5} placeholder="Nội dung cần hỗ trợ" className="w-full rounded-2xl border border-rose-100 px-4 py-3 outline-none" />
        {errors.message ? <p className="text-sm text-rose-500">{errors.message.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          Gửi liên hệ
        </Button>
        {submitted ? <p className="text-sm text-emerald-600">Form mock đã được ghi nhận.</p> : null}
      </form>
    </Card>
  );
}
