import { Skeleton } from "@/components/ui/skeleton"

export default function ServiceDetailLoading() {
  return (
    <div className="pb-24 pt-28 lg:pb-32 lg:pt-36">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-5 w-40" />
          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-8">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="mt-6 h-12 w-2/3" />
            <Skeleton className="mt-4 h-5 w-full" />
            <Skeleton className="mt-3 h-5 w-5/6" />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[720px] rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
