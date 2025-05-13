import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Skeleton for header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Skeleton for filter chips */}
      <div className="flex space-x-2">
        {Array(4)
          .fill(null)
          .map((_, i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
      </div>

      {/* Skeleton for table */}
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
