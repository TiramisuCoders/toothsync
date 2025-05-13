import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Table Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
      </div>
    </div>
  )
}
