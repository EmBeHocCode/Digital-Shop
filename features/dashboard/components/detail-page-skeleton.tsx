import { Skeleton } from "@/components/ui/skeleton"

export function DetailPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-9 w-72" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
