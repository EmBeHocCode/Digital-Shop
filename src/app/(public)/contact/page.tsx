import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Liên hệ | MeowMarket",
  description: "Form liên hệ, email, hotline và social của MeowMarket."
};

export default function ContactRoute() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-ink">Liên hệ</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            Hỗ trợ khách hàng, hợp tác đối tác và tư vấn sản phẩm số cho thị trường Việt Nam.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Email", "hello@meowmarket.vn"],
            ["Hotline", "1900 6868"],
            ["Social", "Facebook / TikTok / Discord"]
          ].map(([title, content]) => (
            <Card key={title}>
              <p className="text-sm text-muted">{title}</p>
              <p className="mt-3 text-lg font-bold text-ink">{content}</p>
            </Card>
          ))}
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
