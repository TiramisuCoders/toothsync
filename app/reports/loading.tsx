import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsLoading() {
  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {Array(7)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="academic-year" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="academic-year" disabled>
                Academic Year Management
              </TabsTrigger>
              <TabsTrigger value="clinician-history" disabled>
                Clinician History
              </TabsTrigger>
              <TabsTrigger value="activity-history" disabled>
                Activity History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="academic-year">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(5)
                      .fill(null)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
