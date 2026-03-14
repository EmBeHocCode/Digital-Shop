import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/80 bg-card/95 p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-border/80 bg-card/95 p-6">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card/95 p-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/95 p-6">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
