import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Form Skeleton */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          {Array(5)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          <Skeleton className="h-10 w-full mt-6" />
        </CardContent>
      </Card>
    </div>
  )
}
