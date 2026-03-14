import { formatCurrency } from "@/utils/format";

export function PriceTag({
  price,
  compareAtPrice
}: {
  price: number;
  compareAtPrice?: number;
}) {
  return (
    <div className="space-y-1">
      {compareAtPrice ? (
        <p className="text-sm text-muted line-through">{formatCurrency(compareAtPrice)}</p>
      ) : null}
      <p className="text-2xl font-black text-ink">{formatCurrency(price)}</p>
    </div>
  );
}
