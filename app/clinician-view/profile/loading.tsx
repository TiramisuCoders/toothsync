import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <Skeleton className="h-10 w-48 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Skeleton className="h-12 w-full mb-4 rounded-lg" />
          <Skeleton className="h-[450px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
