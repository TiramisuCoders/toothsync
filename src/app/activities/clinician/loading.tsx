import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6 bg-[#f5faf7] min-h-screen">
      {/* Header Skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Table Skeleton */}
      <div className="border rounded-md shadow-sm overflow-hidden">
        {/* Table Header Skeleton */}
        <div className="grid grid-cols-7 bg-gray-50 p-4 gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>

        {/* Table Rows Skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 p-4 border-t">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
