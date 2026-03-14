import { format } from "date-fns";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string) {
  return format(new Date(value), "dd/MM/yyyy");
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    compactDisplay: "short"
  }).format(value);
}
