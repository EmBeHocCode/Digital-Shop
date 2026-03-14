"use client";

import { motion } from "framer-motion";
import type { Banner } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BannerSlider({ banners }: { banners: Banner[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {banners.map((banner, index) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
        >
          <Card className="h-full bg-gradient-to-br from-[#fff0f6] via-white to-[#eef3ff]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              {banner.placement}
            </p>
            <h3 className="mt-4 text-2xl font-black text-ink">{banner.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{banner.description}</p>
            <div className="mt-6">
              <Button href={banner.ctaLink}>{banner.ctaLabel}</Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
