"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, RockingChair, LogOut, Plus, ChevronDown, ChevronUp, Clock, CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { getProcedures, submitAttendanceAction } from "@/app/api/form/clinician/action"

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
  todayCount: number
  availableChair1st: number
  availableChair2nd: number
  instructorsOnDuty1st: number
  instructorsOnDuty2nd: number
}

interface Instructor {
  name: string
  departments: string
  shift: string
}

interface Procedure {
  procedure_id: string
  name: string
  department: string
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
  const [presentInstructors, setPresentInstructors] = useState<Instructor[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const [summary, setSummary] = useState<DashboardSummary>({
    todayCount: 0,
    availableChair1st: 0,
    availableChair2nd: 0,
    instructorsOnDuty1st: 0,
    instructorsOnDuty2nd: 0,
  })

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([])
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    shift: "",
    patient_type: "",
    patientFirstName: "",
    patientLastName: "",
    selectedProcedures: [] as string[],
    chair: "Auto-assigned",
    instructor: "Auto-assigned",
    clinicianUserId: "",
    requestDate: new Date().toISOString().split("T")[0],
  })

  const proceduresByDepartment = useMemo(() => {
    const grouped: Record<string, Procedure[]> = {}
    allProcedures.forEach((procedure) => {
      const dept = procedure.department || "Other"
      if (!grouped[dept]) {
        grouped[dept] = []
      }
      grouped[dept].push(procedure)
    })
    Object.keys(grouped).forEach((dept) => {
      grouped[dept].sort((a, b) => a.name.localeCompare(b.name))
    })
    return grouped
  }, [allProcedures])

  const departments = useMemo(() => {
    return Object.keys(proceduresByDepartment).sort()
  }, [proceduresByDepartment])

  const selectedProcedureNames = useMemo(() => {
    return allProcedures
      .filter((p) => formData.selectedProcedures.includes(p.procedure_id))
      .map((p) => `${p.name} (${p.department})`)
  }, [formData.selectedProcedures, allProcedures])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch dashboard records
        const start = performance.now()

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
          setPresentInstructors(records.availableInstructors)

          if (records.user) {
            setFormData((prev) => ({
              ...prev,
              clinicianUserId: records.user.id,
              firstName: records.user.name?.split(" ")[0] || "",
              lastName: records.user.name?.split(" ").slice(1).join(" ") || "",
            }))
          }
        } else {
          throw new Error(records.error || "Failed to fetch records")
        }

        const { error: procedureError, procedures: procedureData } = await getProcedures()
        if (!procedureError) {
          setAllProcedures(procedureData)
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    console.log(presentInstructors)
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

  const handleTimeoutConfirm = async () => {
    if (!clinicianToTimeout) return

    try {
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      })

      setTodaysActivities((prev) =>
        prev.map((record) => (record.id === clinicianToTimeout.id ? { ...record, timeOut: currentTime } : record)),
      )

      const response = await fetch("/api/attendance/timeOut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "timeout",
          record_id: clinicianToTimeout.record_id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to record timeout")
      }

      setIsTimeoutModalOpen(false)
      setClinicianToTimeout(null)

      toast({
        title: "Time Out Recorded",
        description: "The clinician's time out has been successfully recorded.",
      })
    } catch (error) {
      setTodaysActivities((prev) =>
        prev.map((record) => (record.id === clinicianToTimeout.id ? { ...record, timeOut: "-" } : record)),
      )

      console.log(error)

      toast({
        title: "Update Failed",
        description: "There was a problem recording the time out.",
        variant: "destructive",
      })
    }
  }

  const handleShiftChange = (value: string) => {
    setFormData((prev) => ({ ...prev, shift: value }))
    if (formErrors.shift) setFormErrors((prev) => ({ ...prev, shift: "" }))
  }

  const handlePatientType = (value: string) => {
    setFormData((prev) => ({ ...prev, patient_type: value }))
    if (formErrors.patient_type) setFormErrors((prev) => ({ ...prev, patient_type: "" }))
  }

  const toggleDepartment = (department: string) => {
    setExpandedDepartments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(department)) {
        newSet.delete(department)
      } else {
        newSet.add(department)
      }
      return newSet
    })
  }

  const handleProcedureChange = (procedure: string, checked: boolean) => {
    setFormData((prev) => {
      let newProcedures = [...prev.selectedProcedures]

      if (checked) {
        if (newProcedures.length >= 2) {
          toast({
            title: "Limit Reached",
            description: "You can only select up to 2 procedures.",
          })
          return prev
        }
        newProcedures.push(procedure)
      } else {
        newProcedures = newProcedures.filter((p) => p !== procedure)
      }

      return { ...prev, selectedProcedures: newProcedures }
    })

    if (formErrors.procedures) setFormErrors((prev) => ({ ...prev, procedures: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.shift) {
      newErrors.shift = "Please select a shift"
    }

    if (!formData.patient_type) {
      newErrors.patient_type = "Please indicate the type of patient"
    }

    if (!formData.patientFirstName.trim()) {
      newErrors.patientFirstName = "First name is required"
    }

    if (!formData.patientLastName.trim()) {
      newErrors.patientLastName = "Last name is required"
    }

    if (formData.selectedProcedures.length === 0) {
      newErrors.procedures = "Please select at least one procedure"
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setSubmitProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 200)
    return interval
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitProgress(0)

    const progressInterval = simulateProgress()

    try {
      const submissionData = {
        patientName: `${formData.patientFirstName} ${formData.patientLastName}`.trim(),
        selectedProcedures: formData.selectedProcedures,
        shift: formData.shift,
        patient_type: formData.patient_type,
        clinicianUserId: formData.clinicianUserId,
      }

      const result = await submitAttendanceAction(submissionData)

      clearInterval(progressInterval)
      setSubmitProgress(100)

      if (!result.success) {
        throw new Error(result.error || "Failed to submit request")
      }

      toast({
        title: "Request Submitted",
        description: "Your request has been submitted and is pending approval.",
      })

      // Reset form
      setFormData((prev) => ({
        ...prev,
        shift: "",
        patientFirstName: "",
        patientLastName: "",
        selectedProcedures: [],
        patient_type: "",
        requestDate: new Date().toISOString().split("T")[0],
      }))

      setTimeout(() => {
        setIsRequestModalOpen(false)
        setIsSuccessModalOpen(true)
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Submission error:", error)

      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setSubmitProgress(0)
    }
  }

  const openNewRequestModal = () => {
    setFormData((prev) => ({
      ...prev,
      patientFirstName: "",
      patientLastName: "",
      patient_type: "",
      shift: "",
      selectedProcedures: [],
      requestDate: new Date().toISOString().split("T")[0],
    }))
    setFormErrors({})
    setIsRequestModalOpen(true)
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
          <h1 className="text-2xl font-semibold text-red-600 mb-2">Unable to load user information</h1>
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
        </div>

        <Button onClick={openNewRequestModal} className="bg-[#5C8E77] hover:bg-[#406E58] text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Summary Cards */}
        <div className="space-y-6">
          {/* Available Chairs Card */}
          <Card className="shadow-sm border rounded-lg">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 uppercase mb-4">Available Chairs</p>
              <div className="grid grid-cols-2 gap-6">
                {/* Shift 1 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Shift 1</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-800">{summary.availableChair1st}</h3>
                  </div>
                </div>
                {/* Shift 2 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Shift 2</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-800">{summary.availableChair2nd}</h3>
                  </div>
                  <div className="bg-[#e6f7eb] p-3 rounded-full">
                    <RockingChair className="h-5 w-5 text-[#5C8E77]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructors on Duty Summary Card */}
          <Card className="shadow-sm border rounded-lg">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 uppercase mb-4">Instructors on Duty</p>
              <div className="grid grid-cols-2 gap-6">
                {/* Shift 1 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Shift 1</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-800">{summary.instructorsOnDuty1st}</h3>
                  </div>
                </div>
                {/* Shift 2 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Shift 2</p>
                    <h3 className="text-3xl font-bold mt-1 text-gray-800">{summary.instructorsOnDuty2nd}</h3>
                  </div>
                  <div className="bg-[#e6f7eb] p-3 rounded-full">
                    <Users className="h-5 w-5 text-[#5C8E77]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Detailed Instructor List */}
        <div>
          <Card className="shadow-sm border rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
              <CardTitle className="text-l font-medium text-gray-500 uppercase mt-4">Instructors on Duty</CardTitle>
            </CardHeader>

            <CardContent className="pb-4 px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                {/* Shift 1 */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-500">Shift 1</h3>
                  {presentInstructors.filter((i) => i.shift === "Shift 1").length > 0 ? (
                    <div className="grid gap-4">
                      {presentInstructors
                        .filter((i) => i.shift === "Shift 1")
                        .map((instructor) => (
                          <div key={instructor.name} className="rounded-lg bg-white">
                            <h4 className="font-normal text-sm pl-4 text-gray-800">{instructor.name}</h4>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No instructors for this shift</p>
                  )}
                </div>

                {/* Shift 2 */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-500">Shift 2</h3>
                  {presentInstructors.filter((i) => i.shift === "Shift 2").length > 0 ? (
                    <div className="grid gap-4">
                      {presentInstructors
                        .filter((i) => i.shift === "Shift 2")
                        .map((instructor) => (
                          <div key={instructor.name} className="rounded-lg bg-white">
                            <h4 className="font-normal text-sm pl-4 text-s text-gray-800">{instructor.name}</h4>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No instructors for this shift</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
            <CardContent className="py-8 text-center text-gray-500">No activities for today</CardContent>
          </Card>
        )}
      </div>

      {/* Timeout Confirmation Modal */}
      <Dialog open={isTimeoutModalOpen} onOpenChange={setIsTimeoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Time Out</DialogTitle>
            <DialogDescription>Are you sure you want to record time out ?</DialogDescription>
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
                    timeZone: "Asia/Manila",
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
            <Button onClick={handleTimeoutConfirm} className="bg-[#5C8E77] hover:bg-[#4a7260] text-white">
              Confirm Time Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for global timeout */}
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

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden border-gray-200 rounded-xl">
          <DialogHeader className="border-b px-6 py-4 sticky top-0 z-10 bg-white">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Submit Request</DialogTitle>
            <p className="text-sm text-gray-600">
              Fill out this form to initiate request. Chair and instructor will be auto-assigned.
            </p>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4 space-y-8">
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">Clinician Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input disabled value={formData.firstName} className="bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input disabled value={formData.lastName} className="bg-gray-50 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-1">Patient Information</h3>

              <div className="space-y-2">
                <Label>Patient Name</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Patient first name"
                      value={formData.patientFirstName}
                      onChange={(e) => setFormData({ ...formData, patientFirstName: e.target.value })}
                      className={formErrors.patientFirstName ? "border-red-500" : "focus:border-[#5C8E77]"}
                    />
                    {formErrors.patientFirstName && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.patientFirstName}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Patient last name"
                      value={formData.patientLastName}
                      onChange={(e) => setFormData({ ...formData, patientLastName: e.target.value })}
                      className={formErrors.patientLastName ? "border-red-500" : "focus:border-[#5C8E77]"}
                    />
                    {formErrors.patientLastName && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.patientLastName}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Patient Type</Label>
                <div className="relative">
                  <Select value={formData.patient_type} onValueChange={handlePatientType}>
                    <SelectTrigger className={formErrors.patient_type ? "border-red-500" : "focus:border-[#5C8E77]"}>
                      <SelectValue placeholder="Select patient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formErrors.patient_type && <p className="text-sm text-red-500">{formErrors.patient_type}</p>}
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">Activity Details</h3>

              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={formData.shift} onValueChange={handleShiftChange}>
                  <SelectTrigger className={formErrors.shift ? "border-red-500" : "focus:border-[#5C8E77]"}>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.shift && <p className="text-sm text-red-500">{formErrors.shift}</p>}
              </div>

              <div className="space-y-2">
                <Label>Request Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.requestDate}
                    disabled
                    className="bg-gray-50 text-gray-500 cursor-not-allowed pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  You can only submit requests for today. Future-date requests are disabled.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Procedure</Label>
                </div>
                <p className="text-sm text-gray-500">Select up to 2 procedures across any department.</p>

                {formData.selectedProcedures.length > 0 && (
                  <div className="p-3 border rounded-md bg-[#5C8E77]/5 border-[#5C8E77]/20">
                    <p className="text-xs font-medium mb-2 text-[#5C8E77]">Selected:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcedureNames.map((name, i) => (
                        <span key={i} className="px-2 py-1 rounded text-xs bg-[#5C8E77] text-white">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formErrors.procedures && <p className="text-sm text-red-500">{formErrors.procedures}</p>}
              </div>

              <div className="border border-gray-200 rounded-lg divide-y">
                {departments.map((dept) => {
                  const expanded = expandedDepartments.has(dept)
                  const procedures = proceduresByDepartment[dept]
                  return (
                    <div key={dept}>
                      <button
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="font-medium text-gray-700">{dept}</span>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {expanded && (
                        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-2">
                          {procedures.map((p) => (
                            <label key={p.procedure_id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.selectedProcedures.includes(p.procedure_id)}
                                onChange={(e) => handleProcedureChange(p.procedure_id, e.target.checked)}
                                className="h-4 w-4 text-[#5C8E77] rounded border-gray-300"
                              />
                              {p.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">Auto-assigned Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Requested Chair</Label>
                  <Input disabled value={formData.chair} className="bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <Label>Instructor</Label>
                  <Input disabled value={formData.instructor} className="bg-gray-50 text-gray-500" />
                </div>
              </div>
            </div>

            {isSubmitting && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Processing submission...</span>
                  <span>{submitProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="h-2 bg-[#5C8E77] rounded-full" style={{ width: `${submitProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-white px-6 py-4 sticky bottom-0">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#5C8E77] hover:bg-[#406E58] text-white font-medium py-3"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md text-center space-y-4 py-8">
          <DialogHeader>
            <DialogTitle className="text-green-700 text-lg font-semibold">Request Submitted Successfully!</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-3">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-gray-600">
              Your request has been submitted and is pending approval. Chair and instructor have been auto-assigned.
            </p>
          </div>

          <DialogFooter className="flex justify-center">
            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
