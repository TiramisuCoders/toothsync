// action 

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil, ArrowUpDown, AlertTriangle, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import ArchiveConfirmationModal from "@/components/modals/archive-record-modal"
import GradingModal from "@/components/modals/grading-modal"

interface ProcedureStatus {
  ap_id: string  
  procedure: string
  status: string
  remarks: string
}

interface Activity {
  id: string
  activity_id: string  // ADDED: for API calls
  clinicianName: string
  patientName: string
  instructorName: string
  instructorId: string
  chair: string
  overall_status: string
  procedures: string[]
  procedureDetails: ProcedureDetail[]
  allRecords?: RecordInstance[]  // ADDED: to access latest procedure data
  status: string
  timeIn: string | null
  timeOut: string | null
  archived?: boolean
}

interface RecordInstance {
  id: string
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  procedureStatuses: ProcedureStatus[]
}

interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string
  status?: string
  ap_id?: string  // ADDED: critical for updates
}

export interface InstructorInfo {
  name: string
  role: string
  id: string
}

type DashboardSummary = {
  assignedClinicians1st: number
  assignedClinicians2nd: number
  gradedCount: number
  ungradedCount: number
}

interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  variant: "complete" | "incomplete" | "availability"
  onConfirm: () => void
}

export default function InstructorDashboard() {
  const [gradeValue, setGradeValue] = useState("")
  const [gradeRemarks, setGradeRemarks] = useState("")
  const [loading, setLoading] = useState(true)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activities, setActivitiesRecords] = useState<Activity[]>([])
  const [formData, setFormData] = useState<Activity | null>(null)
  const [todaysActivities, setTodaysActivities] = useState<Activity[]>([])
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({
    assignedClinicians1st: 0,
    assignedClinicians2nd: 0,
    gradedCount: 0,
    ungradedCount: 0,
  })
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "complete",
    onConfirm: () => {},
  })
  const currentDate = new Date()

  useEffect(() => {
    fetchAttendanceRecords()
  }, [])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)

      const start = performance.now()
    
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      console.log('📊 Dashboard Response:', result)
      const end = performance.now()
      console.log(`🌐 Total fetch time: ${(end - start).toFixed(2)} ms`)
  
      if (!response.ok) {
        console.error('Response status:', response.status)
        console.error('Response headers:', [...response.headers.entries()])
        console.error('Error result:', result)
        throw new Error(result.error || `Server error (${response.status}): Failed to load dashboard`)
      }
      
      setTodaysActivities(result.data || [])
      setSummary(result.dashboard)
      setInstructorInfo(result.user)

    } catch (error) {
      console.error('❌ Client error:', error)
      toast({
        title: "Fetch Failed",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
  if (!instructorInfo) {
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

  const today = new Date()
  
  // Get time of day for greeting
  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon"
  } else if (hour >= 18) {
    greeting = "Good evening"
  }

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-[#5C8E77]/10 text-[#5C8E77]"
      case "In Progress":
        return "bg-blue-50 text-blue-700"
      case "Cancelled":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getVariantStyles = (variant: "complete" | "incomplete" | "availability") => {
    switch (variant) {
      case "complete":
        return {
          icon: <Check className="h-6 w-6 text-green-600" />,
          iconBg: "bg-green-50",
          confirmButton: "bg-green-600 hover:bg-green-700",
        }
      case "incomplete":
        return {
          icon: <X className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-50",
          confirmButton: "bg-red-600 hover:bg-red-700",
        }
      case "availability":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          iconBg: "bg-amber-50",
          confirmButton: "bg-amber-600 hover:bg-amber-700",
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-gray-600" />,
          iconBg: "bg-gray-50",
          confirmButton: "bg-gray-600 hover:bg-gray-700",
        }
    }
  }

  // UPDATED: Initialize grading modal with proper procedure data including ap_id
  const initializeGradingModal = (activity: Activity) => {
    console.log('🎯 Initializing grading modal for activity:', activity)
    
    // Get the latest procedure data from most recent record
    const latestProcedureData = activity.allRecords && activity.allRecords.length > 0
      ? activity.procedures?.map((procName: string) => {
          const latestRecord = activity.allRecords![0]
          const procStatus = latestRecord.procedureStatuses?.find(
            (ps: ProcedureStatus) => ps.procedure === procName
          )
          
          return {
            name: procName,
            status: procStatus?.status || "In Progress",
            remarks: procStatus?.remarks || "",
            ap_id: procStatus?.ap_id || ""  // CRITICAL: Include ap_id
          }
        }) || []
      : activity.procedures?.map((procName: string) => ({
          name: procName,
          status: "In Progress",
          remarks: "",
          ap_id: ""
        })) || []

    console.log('📋 Initialized procedure data:', latestProcedureData)

    setCurrentActivity({
      ...activity,
      procedureDetails: latestProcedureData
    })
    setIsGradeModalOpen(true)
  }

  const handleProcedureGradeChange = (index: number, field: 'status' | 'remarks', value: string) => {
    if (!currentActivity) return

    const updatedProcedureDetails = [...(currentActivity.procedureDetails || [])]
    if (!updatedProcedureDetails[index]) {
      // Get ap_id from the latest record if creating new entry
      const latestRecord = currentActivity.allRecords?.[0]
      const procName = currentActivity.procedures[index]
      const procStatus = latestRecord?.procedureStatuses?.find(
        (ps: ProcedureStatus) => ps.procedure === procName
      )
      
      updatedProcedureDetails[index] = {
        name: procName,
        remarks: '',
        status: '',
        ap_id: procStatus?.ap_id || ''
      }
    }
    
    updatedProcedureDetails[index] = {
      ...updatedProcedureDetails[index],
      [field]: value
    }

    setCurrentActivity({
      ...currentActivity,
      procedureDetails: updatedProcedureDetails
    })
  }

  // UPDATED: Match Records.tsx implementation exactly
  const handleSaveGrades = async (updatedProcedures?: any[]) => {
    if (!currentActivity) return

    console.log('=== SAVE GRADES START (Dashboard) ===')
    console.log('Activity ID:', currentActivity.activity_id)
    
    // CRITICAL FIX: Use updatedProcedures from modal if provided, otherwise fallback to currentActivity
    const procedureDetails = updatedProcedures || currentActivity.procedureDetails || []
    
    console.log('📋 Procedure details to save:', procedureDetails)

    if (procedureDetails.length === 0) {
      toast({
        title: "Error",
        description: "No procedures to update",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('All Records:', currentActivity.allRecords)
      
      const procedureUpdates = procedureDetails.map(async (procedure) => {
        console.log('--- Processing procedure ---')
        console.log('Procedure object:', procedure)
        console.log('Procedure name:', procedure.name)
        console.log('Procedure status:', procedure.status)
        console.log('Procedure remarks:', procedure.remarks)
        console.log('Procedure ap_id:', procedure.ap_id)
        
        if (procedure.status && String(procedure.status).trim() !== "") {
          // CRITICAL FIX: Use ap_id directly from the procedure
          if (!procedure.ap_id) {
            console.error('❌ Missing ap_id for procedure:', procedure)
            throw new Error(`Missing ap_id for procedure ${procedure.name}`)
          }

          const updatePayload = {
            activity_id: currentActivity.activity_id,
            ap_id: procedure.ap_id,
            remarks: procedure.remarks || "",
            status: procedure.status
          }

          console.log('📤 Sending update request:', updatePayload)

          const response = await fetch('/api/activities/clinical-instructor', {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload)
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ Failed to update procedure:', errorData)
            throw new Error(`Failed to update procedure ${procedure.name}: ${errorData.error}`)
          }

          const responseData = await response.json()
          console.log('✅ Update response:', responseData)

          return { ...procedure, status: procedure.status }
        }
        return procedure
      })

      const updatedProceduresResult = await Promise.all(procedureUpdates)
      console.log('All procedures updated:', updatedProceduresResult)

      const allCompleted = updatedProceduresResult.every(p => p.status === "Completed")
      console.log('All completed?', allCompleted)

      if (allCompleted) {
        console.log('Updating activity status to Completed')
        const activityResponse = await fetch('/api/activities/clinical-instructor', {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity_id: currentActivity.activity_id,
            update_activity_status: true,
            status: "Completed"
          })
        })

        if (!activityResponse.ok) {
          throw new Error('Failed to update activity status')
        }
      }

      toast({
        title: "Grades Saved",
        description: `Assessment has been saved successfully${allCompleted ? '. Activity marked as completed.' : '.'}`,
      })

      // CRITICAL: Refresh data from server to show updates
      await fetchAttendanceRecords()
      
      // Close the modal after successful update
      setIsGradeModalOpen(false)

    } catch (error) {
      console.error('❌ Error saving grades:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save grades. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleArchiveClick = (activity: Activity) => {
    setCurrentActivity(activity)
    setIsArchiveModalOpen(true)
  }
  
  const handleArchive = async () => {
    if (!currentActivity) return

    try {
      const res = await fetch("/api/activities/archive-activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: currentActivity.id,
          status: "Cancelled",
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        console.error("❌ Archive failed:", result)
        toast({
          title: "Error",
          description: "Failed to update activity status.",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setTodaysActivities(
        todaysActivities.map((activity) =>
          activity.id === currentActivity.id
            ? { ...activity, status: "Cancelled" }
            : activity
        )
      )

      setIsArchiveModalOpen(false)
      toast({
        title: "Activity Marked Cancelled",
        description: `Activity ${currentActivity.id} has been marked as cancelled.`,
        variant: "destructive",
      })
      
      // Refresh dashboard data
      await fetchAttendanceRecords()
      
    } catch (error) {
      console.error("❌ Network error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const closeConfirmationModal = () => {
    setConfirmationState((prev) => ({ ...prev, isOpen: false }))
  }

  const handleConfirmAction = () => {
    confirmationState.onConfirm()
    closeConfirmationModal()
  }

  // Format the date as "Day of week, Month Day, Year"
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const confirmationStyles = getVariantStyles(confirmationState.variant)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{greeting}, {instructorInfo.name}!</h1>
        <p className="text-gray-500">{formattedDate}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">Assigned Clinicians</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.assignedClinicians1st}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 2</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.assignedClinicians2nd}
                  </h3>
                </div>
                <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <User className="h-6 w-6 text-[#5C8E77]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Graded Clinicians</h3>
                <p className="text-xs font-medium text-gray-500">Finished grading</p>
                <p className="text-4xl font-semibold mt-1">{summary.gradedCount}</p>
              </div>
              <div className="bg-[#e6f7eb] p-3 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Not Yet Graded</h3>
                <p className="text-xs font-medium text-gray-500">To grade</p>
                <p className="text-4xl font-semibold mt-1">{summary.ungradedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <X className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activities */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <CardTitle className="text-xl font-semibold text-[#333]">Today's Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium">
                  <div className="flex items-center">
                    Act ID
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="font-medium">Clinician</TableHead>
                <TableHead className="font-medium">Patient Name</TableHead>
                <TableHead className="font-medium">Chair</TableHead>
                <TableHead className="font-medium">Procedure</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysActivities.length > 0 ? (
                todaysActivities.map((activity) => (
                  <TableRow key={activity.id} className="border-b">
                    <TableCell className="font-medium">{activity.id}</TableCell>
                    <TableCell>{activity.clinicianName}</TableCell>
                    <TableCell>{activity.patientName}</TableCell>
                    <TableCell>{activity.chair}</TableCell>
                    <TableCell className="text-[#333]">
                      <div className="space-y-1">
                        {activity.procedureDetails && activity.procedureDetails.length > 0 ? (
                          activity.procedureDetails.map((procedure, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span>{procedure.name}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          activity.procedures?.map((procedure, index) => (
                            <div key={index} className="text-sm">
                              {procedure}
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`px-3 py-1 rounded-full text-sm inline-flex items-center justify-center font-medium ${getStatusColor(
                          activity.overall_status,
                        )}`}
                      >
                        {activity.overall_status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {activity.overall_status !== "Cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-600 hover:bg-blue-50 bg-transparent"
                            onClick={() => initializeGradingModal(activity)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {activity.overall_status === "In Progress" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveClick(activity)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No activities today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ArchiveConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchive}
        activity={currentActivity}
      />
     
      <GradingModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        currentActivity={currentActivity}
        onProcedureChange={handleProcedureGradeChange}
        onSave={handleSaveGrades}
      />
    </div>
  )
}