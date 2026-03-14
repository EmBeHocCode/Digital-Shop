"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faGift,
  faServer,
  faTicket
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import type { Category } from "@/types/domain";
import { Card } from "@/components/ui/card";

const iconMap = {
  server: faServer,
  cloud: faCloud,
  gift: faGift,
  ticket: faTicket
};

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/products?category=${category.children?.[0]?.id ?? category.id}`}>
      <Card className="group h-full border border-white/80 transition hover:-translate-y-1 hover:border-primary hover:shadow-premium">
        <motion.div
          whileHover={{ rotate: -6, scale: 1.04 }}
          className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-pink-100 text-primary"
        >
          <FontAwesomeIcon
            icon={iconMap[category.icon as keyof typeof iconMap] ?? faServer}
            className="h-6 w-6"
          />
        </motion.div>
        <h3 className="mt-5 text-xl font-bold text-ink">{category.name}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">{category.description}</p>
      </Card>
    </Link>
  );
}
