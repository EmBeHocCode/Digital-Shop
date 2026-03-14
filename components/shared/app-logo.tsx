import Link from "next/link"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppLogoProps {
  href?: string
  title?: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
  onClick?: () => void
}

function LogoContent({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
}: Pick<AppLogoProps, "subtitle" | "subtitleClassName" | "title" | "titleClassName">) {
  return (
    <>
      <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
        <Zap className="size-4" />
      </div>
      <div className="grid min-w-0 text-left leading-tight">
        <span className={cn("truncate font-bold text-base tracking-tight", titleClassName)}>
          {title}
        </span>
        {subtitle ? (
          <span className={cn("truncate text-xs text-muted-foreground", subtitleClassName)}>
            {subtitle}
          </span>
        ) : null}
      </div>
    </>
  )
}

export function AppLogo({
  href,
  title = "NexCloud",
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  onClick,
}: AppLogoProps) {
  const content = (
    <LogoContent
      subtitle={subtitle}
      subtitleClassName={subtitleClassName}
      title={title}
      titleClassName={titleClassName}
    />
  )

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center gap-2.5", className)}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("flex items-center gap-2.5", className)}>
        {content}
      </button>
    )
  }

  return <div className={cn("flex items-center gap-2.5", className)}>{content}</div>
}
