export function LoadingSkeleton({
  className = "h-6 w-full"
}: {
  className?: string;
}) {
  return <div className={`shimmer-bg animate-shimmer rounded-2xl ${className}`} />;
}
