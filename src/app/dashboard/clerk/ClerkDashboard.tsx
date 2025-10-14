"use client"

import { useEffect, useState } from "react"
import { Calendar, Check, LogOut, RockingChair, Users, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

export interface Record {
  id: string
  chair?: string
  instructorName: string
  procedures: string[]
  timeIn: string
  timeOut: string
  status: string
  clinicianName: string
}

export interface ClerkInfo {
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
  request1st: number
  request2nd: number
}

export default function ClerkDashboard() {
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceRecords] = useState<Record[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<Record | null>(null)
  const [clinicianToTimeout, setClinicianToTimeout] = useState<Record | null>(null)
  const [clerkInfo, setClerkInfo] = useState<ClerkInfo | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({
    todayCount: 0,
    availableChair1st: 0,
    availableChair2nd: 0,
    instructorsOnDuty1st: 0,
    instructorsOnDuty2nd: 0,
    request1st: 0,
    request2nd: 0
  })

  // Get current date
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = today.toLocaleDateString("en-US", options)

  // Format for greeting header
  const day = today.toLocaleDateString("en-US", { weekday: "long" })
  const month = today.toLocaleDateString("en-US", { month: "long" })
  const date = today.getDate()
  const year = today.getFullYear()
  const formattedGreetingDate = `${day}, ${month} ${date}, ${year}`

  // Get time of day for greeting
  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon"
  } else if (hour >= 18) {
    greeting = "Good evening"
  }

  useEffect(() => {
    async function fetchSummary() {
      const res = await fetch("/api/dashboard")
      const data = await res.json()
      setSummary(data)
    }

    fetchAttendanceRecords()
    fetchSummary()
  }, [])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching from client...')

      const response = await fetch('/api/dashboard', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('- Response status:', response.status)
      console.log('- Response ok:', response.ok)

      const result = await response.json()
      console.log('- Response body:', result)

      if (!response.ok) {
        console.error('Response status:', response.status)
        console.error('Response headers:', [...response.headers.entries()])
        console.error('Error result:', result)

        throw new Error(result.error || `Server error (${response.status}): Failed to update sanitization`)
      }
      setAttendanceRecords(result.data || [])

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
        setClerkInfo(userInfo.data)
      } else {
        throw new Error(userInfo.error || "Failed to fetch user info")
      }

    } catch (error) {
      console.error('❌ Client error:', error)
      toast({
        title: "Fetch Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to handle confirm attendance
  const handleConfirmAttendance = async (id: string) => {
    try {
      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === id ? { ...record, status: "Confirmed" } : record
        )
      )

      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm attendance')
      }

      toast({
        title: "Attendance Confirmed",
        description: "The clinician has been marked as present.",
      })

    } catch (error) {
      console.error("Failed to confirm attendance:", error)

      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === id ? { ...record, status: "Pending" } : record
        )
      )

      toast({
        title: "Update Failed",
        description: "There was a problem confirming the attendance.",
        variant: "destructive",
      })
    }
  }

  // Function to handle sanitization update
  const handleSanitizeChange = (id: string, value: string) => {
    const newSanitizeValue = value.charAt(0).toUpperCase() + value.slice(1)
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.id === id ? { ...record, sanitize: newSanitizeValue } : record
      )
    )
  }

  // Function to handle timeout click - opens modal
  const handleTimeoutClick = (record: Record) => {
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
      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === clinicianToTimeout.id ? { ...record, timeOut: currentTime } : record
        )
      )

      const response = await fetch('/api/attendance/timeOut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'timeout',
          record_id: clinicianToTimeout.id
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
      console.error("Failed to record timeout:", error)

      // Rollback optimistic update
      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === clinicianToTimeout.id ? { ...record, timeOut: "-" } : record
        )
      )

      toast({
        title: "Update Failed",
        description: "There was a problem recording the time out.",
        variant: "destructive",
      })
    }
  }

  // Function to handle delete click
  // const handleDeleteClick = (record: Record) => {
  //   setAttendanceToDelete(record)
  //   setIsDeleteModalOpen(true)
  // }

  // Function to handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!attendanceToDelete) return

    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          record_id: attendanceToDelete.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete attendance')
      }

      setAttendanceRecords(prev =>
        prev.filter(record => record.id !== attendanceToDelete.id)
      )

      setIsDeleteModalOpen(false)
      setAttendanceToDelete(null)

      toast({
        title: "Attendance Deleted",
        description: "The attendance record has been deleted.",
        variant: "destructive",
      })

    } catch (error) {
      console.error("Failed to delete attendance:", error)
      toast({
        title: "Delete Failed",
        description: "Could not delete the attendance record.",
        variant: "destructive",
      })
    }
  }

  // Error state
  if (!clerkInfo) {
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
    <div className="space-y-6">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">{greeting}, {clerkInfo.name}!</h1>
        <p className="text-gray-500">{formattedGreetingDate}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">PENDING ATTENDANCE</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.request1st}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 2</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.request2nd}
                  </h3>
                </div>
                <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-[#5C8E77]" />
                </div>
              </div>
              <p className="text-sm text-gray-500">To approve</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">Available Chairs</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.availableChair1st}
                  </h3>
                </div>
              </div>
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
              <p className="text-sm text-gray-500">Ready for use</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">
              Instructors On Duty
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.instructorsOnDuty1st}
                  </h3>
                </div>
              </div>
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

      {/* Today's Attendance Queue */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Today's Activities</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="py-3 px-4 font-medium text-gray-700">Activity ID</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Clinician</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Chair</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Instructor</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Time In</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Time Out</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Procedure</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Status</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.length > 0 ? (
              attendanceData.map((attendance) => (
                <TableRow key={attendance.id} className="border-b last:border-0">
                  <TableCell className="py-3 px-4">{attendance.id}</TableCell>
                  <TableCell className="py-3 px-4">{attendance.clinicianName}</TableCell>
                  <TableCell className="py-3 px-4">{attendance.chair}</TableCell>
                  <TableCell className="py-3 px-4">{attendance.instructorName}</TableCell>
                  <TableCell className="py-3 px-4">{attendance.timeIn}</TableCell>
                  <TableCell className="py-3 px-4">{attendance.timeOut || "-"}</TableCell>
                  <TableCell className="py-3 px-4">
                    {attendance.procedures && attendance.procedures.length > 0 ? (
                      <div className="space-y-1">
                        {attendance.procedures.map((proc, index) => (
                          <div key={index} className="text-sm">
                            {proc}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm inline-flex items-center justify-center font-medium ${
                        attendance.status === "Completed"
                          ? "bg-[#5C8E77] text-white"
                          : "bg-white text-[#F59E0B] border border-[#F59E0B]"
                      }`}
                    >
                      {attendance.status}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={attendance.status !== "Completed"}
                        onClick={() => handleTimeoutClick(attendance)}
                        title={
                          attendance.timeOut !== "-"
                            ? "Time out already recorded"
                            : attendance.status !== "Completed"
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
                <TableCell colSpan={10} className="py-6 text-center text-gray-500">
                  No activities today
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Timeout Confirmation Modal */}
      <Dialog open={isTimeoutModalOpen} onOpenChange={setIsTimeoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Time Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to record time out for{" "}
              <span className="font-semibold text-gray-900">
                {clinicianToTimeout?.clinicianName}
              </span>
              ?
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

      {/* Delete Confirmation Modal (if you still need it) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the attendance record for{" "}
              <span className="font-semibold text-gray-900">
                {attendanceToDelete?.clinicianName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setAttendanceToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}