import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionTone = "neutral" | "blue" | "cyan" | "violet"
type SectionAlign = "center" | "left"

interface SectionShellProps {
  id?: string
  eyebrow?: string
  title?: string
  description?: string
  tone?: SectionTone
  align?: SectionAlign
  children: ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
}

export function SectionShell({
  align = "center",
  children,
  className,
  contentClassName,
  description,
  eyebrow,
  headerClassName,
  id,
  title,
  tone = "neutral",
}: SectionShellProps) {
  const hasIntro = eyebrow || title || description

  return (
    <section
      id={id}
      data-tone={tone}
      className={cn("landing-section-shell py-24 lg:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {hasIntro ? (
          <div
            className={cn(
              "mx-auto max-w-3xl",
              align === "center" ? "text-center" : "text-left",
              headerClassName
            )}
          >
            {eyebrow ? (
              <div className={cn("inline-flex", align === "center" && "justify-center")}>
                <span className="premium-chip px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/85">
                  {eyebrow}
                </span>
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={cn(hasIntro && "mt-14 lg:mt-16", contentClassName)}>{children}</div>
      </div>
    </section>
  )
}
