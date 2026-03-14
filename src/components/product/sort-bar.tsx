import Link from "next/link";

const options = [
  { value: "featured", label: "Nổi bật" },
  { value: "price-asc", label: "Giá tăng" },
  { value: "price-desc", label: "Giá giảm" },
  { value: "popularity", label: "Phổ biến" },
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" }
] as const;

export function SortBar({
  createHref,
  activeSort
}: {
  createHref: (sort: (typeof options)[number]["value"]) => string;
  activeSort?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <Link
          key={option.value}
          href={createHref(option.value)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            activeSort === option.value
              ? "bg-primary text-white shadow-soft"
              : "bg-rose-50 text-ink hover:bg-white hover:shadow-sm"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
