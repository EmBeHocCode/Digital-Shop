import Link from "next/link";
import { cn } from "@/utils/cn";

export function Pagination({
  currentPage,
  totalPages,
  createPageHref
}: {
  currentPage: number;
  totalPages: number;
  createPageHref: (page: number) => string;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {pages.map((page) => (
        <Link
          key={page}
          href={createPageHref(page)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition",
            page === currentPage
              ? "border-primary bg-primary text-white"
              : "border-rose-100 bg-white text-ink hover:border-primary hover:text-primary"
          )}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
