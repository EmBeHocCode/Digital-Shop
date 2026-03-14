import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const toneClasses = {
  surface:
    "border-[rgba(20,30,50,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(252,252,255,0.95)_100%)]",
  soft: "border-[rgba(20,30,50,0.06)] bg-soft-mesh",
  hero:
    "border-white/75 bg-hero-gradient bg-[length:160%_160%] shadow-glow animate-gradient-shift",
  dark: "border-slate-900/10 bg-ink text-white shadow-premium"
} as const;

type SectionBoxTone = keyof typeof toneClasses;

interface SectionBoxProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SectionBoxTone;
}

export function SectionBox({
  tone = "surface",
  className,
  children,
  ...props
}: SectionBoxProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border px-5 py-6 shadow-[0_10px_30px_rgba(20,30,50,0.04)] md:rounded-[32px] md:px-8 md:py-8 lg:px-10 lg:py-10",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
