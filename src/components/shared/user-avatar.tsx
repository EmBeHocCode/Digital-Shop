import { cn } from "@/utils/cn";
import { getAvatarFallbackLabel, isAvatarImageSource } from "@/utils/avatar";

function getFallbackTextSize(size: number) {
  if (size <= 40) {
    return "text-sm";
  }

  if (size <= 64) {
    return "text-lg";
  }

  return "text-2xl";
}

export function UserAvatar({
  fullName,
  avatar,
  size = 80,
  className,
  textClassName
}: {
  fullName: string;
  avatar?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
}) {
  const imageSource = isAvatarImageSource(avatar) ? avatar : null;
  const fallbackLabel = getAvatarFallbackLabel(fullName, avatar);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-soft",
        className
      )}
      style={{ width: size, height: size }}
    >
      {imageSource ? (
        <div
          aria-label={`Ảnh đại diện của ${fullName}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${imageSource}")` }}
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-black uppercase tracking-[0.08em]",
            getFallbackTextSize(size),
            textClassName
          )}
        >
          {fallbackLabel}
        </span>
      )}
    </div>
  );
}
