// YEAR AND SECTION OF THE CLINICIAN
// TIME IN AND OUT INTERFACE

"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, RockingChair, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export interface Activity {
  id: string
  patientName: string
  chair?: string
  instructor?: string
  procedures: string[]
  status: string
  timeIn?: string
  timeOut?: string
  todayCount: string
}

export interface ClinicianInfo {
  name: string
  role: string
  id: string
}

type DashboardSummary = {
  todayCount: number
  availableChair1st: number
  availableChair2nd: number
  instructorsOnDuty1st: number
  instructorsOnDuty2nd: number
}

export default function ClinicianDashboard() {
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [todaysActivities, setTodaysActivities] = useState<Activity[]>([])
  const [clinicianInfo, setClinicianInfo] = useState<ClinicianInfo | null>(null)
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({
    todayCount: 0,
    availableChair1st: 0,
    availableChair2nd: 0,
    instructorsOnDuty1st: 0,
    instructorsOnDuty2nd: 0,   
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch dashboard records
        const recordsResponse = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!recordsResponse.ok) {
          throw new Error(`HTTP error! status: ${recordsResponse.status}`)
        }

        const records = await recordsResponse.json()

        if (records.success) {
          setTodaysActivities(records.data)
        } else {
          throw new Error(records.error || "Failed to fetch records")
        }

        // Fetch user info
        const userResponse = await fetch("/api/getCurrentUser", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`)
        }

        const userInfo = await userResponse.json()

        if (userInfo.success) {
          setClinicianInfo(userInfo.data)
        } else {
          throw new Error(userInfo.error || "Failed to fetch user info")
        }

      } catch (err) {
        // console.error("Error fetching data:", err)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    async function fetchSummary() {
      const res = await fetch("/api/dashboard")
      const data = await res.json()
      setSummary(data)
    }

    fetchData()
    fetchSummary()
  }, [])

  const today = new Date()
  const dayOfWeek = format(today, "EEEE")
  const formattedDate = format(today, "MMMM d, yyyy")

  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17) {
    greeting = "Good evening"
  }

  const canTimeOut =
    todaysActivities.every((activity) => activity.status === "Completed" || activity.status === "Cancelled") ||
    !todaysActivities.some((activity) => activity.status === "In Progress")

  const handleTimeoutRequest = () => {
    setShowTimeoutDialog(true)
  }

  const handleTimeoutConfirm = async () => {
  setIsSubmitting(true)

  try {
    // Get the record_id of today’s activity
    const recordId = todaysActivities[0]?.id // assuming all share same ID

    if (canTimeOut && recordId) {
      // 🕒 Call the same API endpoint to record timeout
      const response = await fetch("/api/attendance/timeOut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "timeout",
          record_id: recordId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to record timeout")
      }
    }

    // Simulate slight delay for UX
    setTimeout(() => {
      setIsSubmitting(false)
      setShowTimeoutDialog(false)
      setHasTimedOut(true)

      // Locally update activity statuses
      setTodaysActivities((prev) =>
        prev.map((activity) => {
          if (activity.status === "Pending") {
            return { ...activity, status: "Cancelled" }
          }
          if (activity.status === "In Progress") {
            return { ...activity, status: "Incomplete" }
          }
          return activity
        })
      )

      toast({
        title: "Time Out Successful",
        description: `You have timed out at ${format(new Date(), "h:mm a")}`,
      })
    }, 1500)
  } catch (error) {
    // console.error("Failed to record timeout:", error)

    toast({
      title: "Update Failed",
      description: "There was a problem recording the timeout.",
      variant: "destructive",
    })

    setIsSubmitting(false)
  }
}


  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm border rounded-lg">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (!clinicianInfo) {
    return (
      <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Unable to load user information
          </h1>
          <p className="text-gray-500">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {greeting}, {clinicianInfo.name}!
          </h1>
          <p className="text-gray-500">
            {dayOfWeek}, {formattedDate}
          </p>
          <div className="mt-2">
            <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">
              {clinicianInfo.role}
            </Badge>
          </div>
        </div>

        {!hasTimedOut && (
          <Button onClick={handleTimeoutRequest} className="bg-[#5C8E77] hover:bg-[#406E58]">
            <LogOut className="mr-2 h-4 w-4" /> Time Out
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
          <p className="text-sm font-medium text-gray-500 uppercase">Today's Activities</p>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{summary.todayCount}</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <Calendar className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card> */}

        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">Available Chairs</p>

            <div className="grid grid-cols-2 gap-6">
              {/* Shift 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.availableChair1st}
                  </h3>
                </div>
                {/* <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <RockingChair className="h-5 w-5 text-[#5C8E77]" />
                </div> */}
              </div>

              {/* Shift 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 2</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.availableChair2nd}
                  </h3>
                </div>
                <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <RockingChair className="h-5 w-5 text-[#5C8E77]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">
              Instructors On Duty
            </p>

            <div className="grid grid-cols-2 gap-6">
              {/* Shift 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.instructorsOnDuty1st}
                  </h3>
                </div>
                {/* <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <Users className="h-5 w-5 text-[#5C8E77]" />
                </div> */}
              </div>

              {/* Shift 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 2</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.instructorsOnDuty2nd}
                  </h3>
                </div>
                <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <Users className="h-5 w-5 text-[#5C8E77]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Clinicians Logged In</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{cliniciansLoggedIn}</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <Users className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card> */}

        
      </div>

      {/* Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Activities</h2>

        {todaysActivities.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Activity ID</TableHead>
                  <TableHead className="font-semibold">Patient Name</TableHead>
                  <TableHead className="font-semibold">Chair</TableHead>
                  <TableHead className="font-semibold">Time In</TableHead>
                  <TableHead className="font-semibold">Time Out</TableHead>
                  <TableHead className="font-semibold">Procedure</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysActivities.length > 0 ? (
                  todaysActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.id}</TableCell>
                      <TableCell>{activity.patientName}</TableCell>
                      <TableCell>{activity.chair || "—"}</TableCell>
                      <TableCell>{activity.timeIn || "—"}</TableCell>
                      <TableCell>{activity.timeOut || "—"}</TableCell>
                      <TableCell>
                        {activity.procedures && activity.procedures.length > 0 ? (
                          <div className="space-y-1">
                            {activity.procedures.map((proc, index) => (
                              <div key={index} className="text-sm">
                                {proc}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.status === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : activity.status === "In Progress"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : activity.status === "Cancelled"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : activity.status === "Incomplete"
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No activities found for today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No activities for today
          </CardContent>
        </Card>
      )}
      </div>

      {/* Dialog */}
      <Dialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Time Out</DialogTitle>
            <DialogDescription>
              {canTimeOut
                ? "You are about to record your time out for today. This action cannot be undone."
                : "Warning: You have activities that are still in progress. If you time out now, they will be marked as incomplete."}
            </DialogDescription>
          </DialogHeader>

          {!canTimeOut && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
              <p className="font-medium">Activities requiring attention:</p>
              <ul className="list-disc pl-5 mt-1">
                {todaysActivities
                  .filter((activity) => activity.status === "In Progress" || activity.status === "Pending")
                  .map((activity) => (
                    <li key={activity.id}>
                      {activity.id} - {activity.procedures.join(", ")} ({activity.status})
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimeoutConfirm} className="bg-[#5C8E77] hover:bg-[#406E58]" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Time Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}