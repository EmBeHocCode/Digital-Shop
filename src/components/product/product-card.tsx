"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import type { Product } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/hooks/use-cart-store";
import { formatCurrency } from "@/utils/format";
import { mapProductToCartItem } from "@/utils/cart";
import { getDefaultProductConfiguration, getProductDisplayMaxPrice, getProductDisplayPrice } from "@/utils/product";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const defaultConfiguration = getDefaultProductConfiguration(product);
  const minPrice = getProductDisplayPrice(product);
  const maxPrice = getProductDisplayMaxPrice(product);

  const handleAddToCart = () => {
    addItem(mapProductToCartItem(product, 1, defaultConfiguration));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div whileHover={{ y: -6 }}>
      <Card className="group flex h-full flex-col gap-4 border border-white/80 p-5 transition duration-300 hover:border-primary/30 hover:shadow-premium">
        <div className="rounded-[24px] bg-gradient-to-br from-rose-100 via-white to-blue-100 p-5 transition duration-300 group-hover:from-[#ffe5ef] group-hover:to-[#e9efff]">
          <div className="flex items-center justify-between">
            <Badge label={product.type} />
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <FontAwesomeIcon icon={faStar} className="h-4 w-4" />
              {product.rating}
            </div>
          </div>
          <div className="mt-10 min-h-[72px]">
            <p className="text-2xl font-bold text-ink">{product.name}</p>
            <p className="mt-2 text-sm text-muted">{product.shortDescription}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Từ</p>
              <p className="text-2xl font-bold text-ink">{formatCurrency(minPrice)}</p>
              {maxPrice > minPrice ? (
                <p className="mt-1 text-xs text-muted">Tối đa {formatCurrency(maxPrice)}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" onClick={handleAddToCart}>
                {added ? "Đã thêm" : "Thêm giỏ"}
              </Button>
              <Button href={`/products/${product.slug}`} variant="outline">
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
