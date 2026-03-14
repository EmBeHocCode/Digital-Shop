"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCat,
  faCloudArrowUp,
  faGift,
  faServer
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import type { Banner } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroBanner({ banner }: { banner: Banner }) {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-hero-gradient bg-[length:160%_160%] px-6 py-12 shadow-glow animate-gradient-shift md:px-10 md:py-16">
      <div className="absolute -right-8 top-8 hidden h-44 w-44 rounded-full bg-pink-200/40 blur-3xl animate-glow lg:block" />
      <div className="absolute bottom-0 right-16 hidden h-36 w-36 rounded-full bg-blue-200/40 blur-3xl animate-glow lg:block" />
      <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-white/40 blur-3xl" />
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="space-y-6"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
            <Badge label="Sàn công nghệ mềm mại" />
          </motion.div>
          <div className="space-y-4">
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="max-w-3xl text-4xl font-black leading-tight text-ink md:text-6xl"
            >
              {banner.title}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="max-w-2xl text-lg text-muted"
            >
              {banner.subtitle}
            </motion.p>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="max-w-2xl text-sm leading-8 text-muted md:text-base"
            >
              {banner.description}
            </motion.p>
          </div>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            className="flex flex-wrap gap-3"
          >
            <Button href={banner.ctaLink}>{banner.ctaLabel}</Button>
            <Button href="/support" variant="outline">
              Xem hỗ trợ
            </Button>
          </motion.div>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { icon: faServer, title: "VPS sẵn sàng", description: "Tạo dịch vụ nhanh sau thanh toán." },
            { icon: faCloudArrowUp, title: "Cloud mạnh", description: "Luồng mua hàng tối ưu cho thiết bị di động." },
            { icon: faGift, title: "Gift card tự động", description: "Cấp mã tự động trong chi tiết đơn hàng." },
            { icon: faCat, title: "Hỗ trợ Meow", description: "Phiếu hỗ trợ thân thiện, rõ ràng." }
          ].map((item) => (
            <motion.div
              key={item.title}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-[28px] border border-white/80 bg-white/80 p-5 backdrop-blur"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100 text-primary">
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
              </div>
              <p className="mt-4 text-lg font-bold text-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
