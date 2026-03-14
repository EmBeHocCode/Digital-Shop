import { cn } from "@/utils/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-white p-6 shadow-card",
        className
      )}
      {...props}
    />
  );
}
