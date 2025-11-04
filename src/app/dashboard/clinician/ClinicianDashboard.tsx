"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string | null
  status?: string
}

interface Activity {
  id: string
  record_id: string
  clinicianName: string
  patientName: string
  instructorName: string
  instructorId: string
  chair: string
  procedures: string[]
  procedureDetails: ProcedureDetail[]
  status: string
  timeIn: string | null
  timeOut: string | null
  archived?: boolean
}

export interface ClinicianInfo {
  name: string
  role: string
  id: string
}

interface DashboardSummary {
  todayCount: number;
  availableChair1st: number;
  availableChair2nd: number;
  instructorsOnDuty1st: number;
  instructorsOnDuty2nd: number;
}

export default function ClinicianDashboard() {
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [todaysActivities, setTodaysActivities] = useState<Activity[]>([])
  const [clinicianInfo, setClinicianInfo] = useState<ClinicianInfo | null>(null)
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)
  const [clinicianToTimeout, setClinicianToTimeout] = useState<Activity | null>(null)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
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
        const start = performance.now();

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
         const end = performance.now()
        console.log(`🌐 Total fetch time: ${(end - start).toFixed(2)} ms`)
  
        if (records.success) {
          setTodaysActivities(records.data)
          setSummary(records.dashboard)
          setClinicianInfo(records.user)
        } else {
          throw new Error(records.error || "Failed to fetch records")
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
    
    fetchData()
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

  const handleTimeoutClick = (record: Activity) => {
      setClinicianToTimeout(record)
      setIsTimeoutModalOpen(true)
    }
  
    // Function to handle timeout confirmation
    const handleTimeoutConfirm = async () => {
      if (!clinicianToTimeout) return
  
      try {
        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila"
        })
  
        // Optimistically update local state
        setTodaysActivities(prev =>
          prev.map(record =>
            record.id === clinicianToTimeout.id ? { ...record, timeOut: currentTime } : record
          )
        )
  
        const response = await fetch('/api/attendance/timeOut', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'timeout',
            record_id: clinicianToTimeout.record_id
          })
        })
  
        const result = await response.json()
  
        if (!response.ok) {
          throw new Error(result.error || 'Failed to record timeout')
        }
  
        setIsTimeoutModalOpen(false)
        setClinicianToTimeout(null)
  
        toast({
          title: "Time Out Recorded",
          description: "The clinician's time out has been successfully recorded.",
        })
  
      } catch (error) {
        // console.error("Failed to record timeout:", error)
  
        // Rollback optimistic update
        setTodaysActivities(prev =>
          prev.map(record =>
            record.id === clinicianToTimeout.id ? { ...record, timeOut: "-" } : record
          )
        )

        console.log(error)
  
        toast({
          title: "Update Failed",
          description: "There was a problem recording the time out.",
          variant: "destructive",
        })
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
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
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
          {/* <div className="mt-2">
            <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">
              {clinicianInfo.role}
            </Badge>
          </div> */}
        </div>

        {/* {!hasTimedOut && (
          <Button onClick={handleTimeoutRequest} className="bg-[#5C8E77] hover:bg-[#406E58]">
            <LogOut className="mr-2 h-4 w-4" /> Time Out
          </Button>
        )} */}
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
        
      </div>

      {/* Table */}
      <div>
        

        {todaysActivities.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <CardTitle className="text-xl font-semibold text-[#333]">Today's Activities</CardTitle>
        </CardHeader>
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
                  <TableHead className="font-semibold">Action</TableHead>
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
                        <TableCell>
                          <div className="flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        // disabled={attendance.status !== "Completed"}
                        onClick={() => handleTimeoutClick(activity)}
                        title={
                          activity.timeOut !== "-"
                            ? "Time out already recorded"
                            : activity.status !== "Completed"
                            ? "Activity must be completed first"
                            : "Record time out"
                        }
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Timeout Confirmation Modal */}
      <Dialog open={isTimeoutModalOpen} onOpenChange={setIsTimeoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Time Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to record time out ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Activity ID:</span>
                <span className="font-medium">{clinicianToTimeout?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time In:</span>
                <span className="font-medium">{clinicianToTimeout?.timeIn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Time:</span>
                <span className="font-medium">
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila"
                  })}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsTimeoutModalOpen(false)
                setClinicianToTimeout(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTimeoutConfirm}
              className="bg-[#5C8E77] hover:bg-[#4a7260] text-white"
            >
              Confirm Time Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          {/* {!canTimeOut && (
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
          )} */}

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