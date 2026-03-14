"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/hooks/use-cart-store";
import type { Product } from "@/types/domain";
import { formatCurrency } from "@/utils/format";
import { mapProductToCartItem } from "@/utils/cart";
import {
  formatProductSpecsSummary,
  getDefaultProductConfiguration,
  getProductConfigurationOptions,
  getProductDisplayCompareAtPrice,
  getProductDisplayPrice
} from "@/utils/product";
import { cn } from "@/utils/cn";

type ProductPurchaseActionsProps = {
  product: Product;
};

export function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const configurationOptions = getProductConfigurationOptions(product);
  const defaultConfiguration = getDefaultProductConfiguration(product);
  const [selectedConfigurationId, setSelectedConfigurationId] = useState(defaultConfiguration?.id);

  const selectedConfiguration = useMemo(
    () =>
      configurationOptions.find((option) => option.id === selectedConfigurationId) ??
      defaultConfiguration,
    [configurationOptions, defaultConfiguration, selectedConfigurationId]
  );

  const displayPrice = selectedConfiguration?.price ?? getProductDisplayPrice(product);
  const displayCompareAtPrice =
    selectedConfiguration?.compareAtPrice ?? getProductDisplayCompareAtPrice(product);

  const addToCart = () => {
    addItem(mapProductToCartItem(product, 1, selectedConfiguration));
  };

  const handleBuyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    addToCart();
    router.push("/cart");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-rose-100 bg-slate-50/80 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
          {configurationOptions.length ? "Cấu hình đang chọn" : "Giá bán"}
        </p>
        {displayCompareAtPrice ? (
          <p className="mt-3 text-sm text-muted line-through">{formatCurrency(displayCompareAtPrice)}</p>
        ) : null}
        <p className="mt-1 text-4xl font-black text-ink">{formatCurrency(displayPrice)}</p>
        {selectedConfiguration ? (
          <>
            <p className="mt-3 text-lg font-bold text-ink">{selectedConfiguration.label}</p>
            <p className="mt-2 text-sm leading-7 text-muted">{selectedConfiguration.description}</p>
            {formatProductSpecsSummary(selectedConfiguration.specs) ? (
              <p className="mt-3 text-sm font-medium text-ink">
                {formatProductSpecsSummary(selectedConfiguration.specs)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">
            {product.deliveryNotes ?? "Chọn gói và tiến hành thanh toán để hệ thống cấp dịch vụ hoặc mã số tương ứng."}
          </p>
        )}
      </div>

      {configurationOptions.length ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Chọn cấu hình</p>
          <div className="grid gap-3">
            {configurationOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedConfigurationId(option.id)}
                className={cn(
                  "rounded-[26px] border p-4 text-left transition duration-200",
                  selectedConfiguration?.id === option.id
                    ? "border-primary bg-rose-50 shadow-soft"
                    : "border-rose-100 bg-white hover:border-primary/60"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-ink">{option.label}</p>
                      {option.isPopular ? (
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                          Bán chạy
                        </span>
                      ) : null}
                    </div>
                    {option.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted">{option.description}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    {option.compareAtPrice ? (
                      <p className="text-xs text-muted line-through">{formatCurrency(option.compareAtPrice)}</p>
                    ) : null}
                    <p className="text-lg font-bold text-ink">{formatCurrency(option.price)}</p>
                  </div>
                </div>
                {formatProductSpecsSummary(option.specs) ? (
                  <p className="mt-3 text-sm font-medium text-ink">
                    {formatProductSpecsSummary(option.specs)}
                  </p>
                ) : null}
                {option.highlights?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleBuyNow}>
          Mua ngay
        </Button>
        <Button type="button" variant="outline" onClick={handleAddToCart}>
          Thêm vào giỏ hàng
        </Button>
      </div>
    </div>
  );
}
