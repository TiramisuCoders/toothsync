import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Skeleton for greeting */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Skeleton for summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
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
