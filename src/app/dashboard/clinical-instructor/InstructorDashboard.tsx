// action 
// - if mag grgrade - just go to the activities and open the modal if possible

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, X, Pencil, Users, ArrowUpDown, AlertTriangle, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import ArchiveConfirmationModal from "@/components/modals/archive-record-modal"
import GradingModal from "@/components/modals/grading-modal"

interface Activity {
  id: string
  clinicianName: string
  patientName: string
  chair: string
  date: string
  procedures: string
  procedureDetails?: ProcedureDetail[]
  status: string
}

interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string
  status?: string
}

export interface InstructorInfo {
  name: string
  role: string
  id: string
}

type DashboardSummary = {
  assignedClinicians1st: number
  assignedClinicians2nd: number
  gradedClinicians: number
  ungradedClinicians: number
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
  const [isAvailable, setIsAvailable] = useState(true)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [gradeValue, setGradeValue] = useState("")
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [gradeRemarks, setGradeRemarks] = useState("")
  const [activities, setActivitiesRecords] = useState<Activity[]>([])
  const [formData, setFormData] = useState<Activity | null>(null)
  const [todaysActivities, setTodaysActivities] = useState<Activity[]>([])
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({
    assignedClinicians1st: 0,
    assignedClinicians2nd: 0,
    gradedClinicians: 0,
    ungradedClinicians: 0,
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
      
      // Add headers to include credentials
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('- Response status:', response.status)
      console.log('- Response ok:', response.ok)
      
      const result = await response.json()
      console.log('- Response body:', result)
  
      if (!response.ok) {
      // Log more details about the error
      console.error('Response status:', response.status)
      console.error('Response headers:', [...response.headers.entries()])
      console.error('Error result:', result)
      
      throw new Error(result.error || `Server error (${response.status}): Failed to update sanitization`)
    }
      setTodaysActivities(result.data || [])

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
        setInstructorInfo(userInfo.data)
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
      
    
  // Centralized data - pulling from admin perspective
  const cliniciansLoggedIn = 24
  const availableInstructors = 3

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
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDates = today.toLocaleDateString("en-US", options)

  // Get the greeting based on time of day
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleSaveActivity = () => {
    if (!formData) return

    setTodaysActivities((prev) => prev.map((activity) => (activity.id === formData.id ? formData : activity)))
    handleCloseEditModal()
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingActivity(null)
    setFormData(null)
  }

  const handleInputChange = (field: keyof Activity, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
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

  const handleCompleteActivity = (activity: Activity) => {
    setConfirmationState({
      isOpen: true,
      title: "Mark as Complete",
      message: `Are you sure you want to mark ${activity.clinicianName}'s ${activity.procedures} as completed?`,
      confirmText: "Mark Complete",
      variant: "complete",
      onConfirm: () => {
        setTodaysActivities((prev) =>
          prev.map((act) => (act.id === activity.id ? { ...act, status: "Completed" } : act)),
        )
      },
    })
  }

  const handleIncompleteActivity = (activity: Activity) => {
    setConfirmationState({
      isOpen: true,
      title: "Mark as Incomplete",
      message: `Are you sure you want to mark ${activity.clinicianName}'s ${activity.procedures} as incomplete? This will require additional follow-up.`,
      confirmText: "Mark Incomplete",
      variant: "incomplete",
      onConfirm: () => {
        setTodaysActivities((prev) =>
          prev.map((act) => (act.id === activity.id ? { ...act, status: "Incomplete" } : act)),
        )
      },
    })
  }

  const handleProcedureGradeChange = (index: number, field: 'grade' | 'remarks', value: string) => {
    if (!currentActivity) return

    const updatedProcedureDetails = [...(currentActivity.procedureDetails || [])]
    if (!updatedProcedureDetails[index]) {
      updatedProcedureDetails[index] = {
        name: currentActivity.procedures[index],
        grade: '',
        remarks: '',
        status: ''
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

  const handleSaveGrades = async () => {
    if (!currentActivity || !currentActivity.procedureDetails) return

    try {
      // Update each procedure's grade and status
      const procedureUpdates = currentActivity.procedureDetails.map(async (procedure) => {
        if (procedure.grade && String(procedure.grade || "").trim() !== "") {
          // Update activity_procedures table
          const response = await fetch('/api/activities/clinical-instructor', {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              record_id: currentActivity.id,
              procedure_name: procedure.name,
              grade: procedure.grade,
              remarks: procedure.remarks || "",
              status: "Completed"
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to update procedure ${procedure.name}`)
          }

          return { ...procedure, status: "Completed" }
        }
        return procedure
      })

      const updatedProcedures = await Promise.all(procedureUpdates)

      // Check if all procedures are now completed
      const allCompleted = updatedProcedures.every(p => p.status === "Completed")

      // If all procedures are completed, update activity_records status
      if (allCompleted) {
        const activityResponse = await fetch('/api/activities/clinical-instructor', {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            record_id: currentActivity.id,
            update_activity_status: true,
            status: "Completed"
          })
        })

        if (!activityResponse.ok) {
          throw new Error('Failed to update activity status')
        }
      }

      // Update local state
      setActivitiesRecords(activities.map(activity => 
        activity.id === currentActivity.id 
          ? { 
              ...activity, 
              procedureDetails: updatedProcedures,
              status: allCompleted ? "Completed" : activity.status
            }
          : activity
      ))

      setIsGradeModalOpen(false)
      toast({
        title: "Grades Saved",
        description: `Assessment has been saved successfully${allCompleted ? '. Activity marked as completed.' : '.'}`,
      })

    } catch (error) {
      console.error('Error saving grades:', error)
      toast({
        title: "Error",
        description: "Failed to save grades. Please try again.",
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
            status: "Cancelled", // or "Incomplete" if that's the exact enum in DB
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
  
        setActivitiesRecords(
          activities.map((activity) =>
            activity.id === currentActivity.id
              ? { ...activity, status: "Cancelled" } // match DB status
              : activity
          )
        )
  
        setIsArchiveModalOpen(false)
        toast({
          title: "Activity Marked Cancelled",
          description: `Activity ${currentActivity.id} has been marked as cancelled.`,
          variant: "destructive",
        })
      } catch (error) {
        console.error("❌ Network error:", error)
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    }
  

  // const handleAvailabilityChange = (checked: boolean) => {
  //   if (!checked && isAvailable) {
  //     // Turning off availability - show confirmation
  //     setConfirmationState({
  //       isOpen: true,
  //       title: "Turn Off Availability",
  //       message:
  //         "Are you sure you want to turn off your availability? You will not receive new clinician assignments until you turn it back on.",
  //       confirmText: "Turn Off",
  //       variant: "availability",
  //       onConfirm: () => setIsAvailable(false),
  //     })
  //   } else {
  //     // Turning on availability - no confirmation needed
  //     setIsAvailable(checked)
  //   }
  // }

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
        <h1 className="text-3xl font-semibold text-gray-800">{greeting}, {instructorInfo.name}!</h1>
        <p className="text-gray-500">{formattedDate}</p>
      </div>

      {/* Instructor Availability */}
      {/* <Card className="shadow-sm">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-1">Instructor Availability</h2>
            <p className="text-gray-500">
              Toggle your availability to be assigned to clinicians. If ON, the system can auto-assign clinicians.
            </p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={handleAvailabilityChange}
            className="scale-125 data-[state=checked]:bg-black"
          />
        </CardContent>
      </Card> */}

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
                <p className="text-4xl font-semibold mt-1">{summary.gradedClinicians}</p>
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
                <p className="text-4xl font-semibold mt-1">{summary.ungradedClinicians}</p>
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
          <CardTitle className="text-xl font-semibold">Today's Activities</CardTitle>
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
                {/* <TableHead className="font-medium">First Name</TableHead> */}
                <TableHead className="font-medium">Clinician</TableHead>
                <TableHead className="font-medium">Patient Name</TableHead>
                <TableHead className="font-medium">Chair</TableHead>
                {/* <TableHead className="font-medium">Date</TableHead> */}
                <TableHead className="font-medium">Procedure</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysActivities.map((activity) => (
                <TableRow key={activity.id} className="border-b">
                  <TableCell className="font-medium">{activity.id}</TableCell>
                  {/* <TableCell>{activity.firstName}</TableCell> */}
                  <TableCell>{activity.clinicianName}</TableCell>
                  <TableCell>{activity.patientName}</TableCell>
                  <TableCell>{activity.chair}</TableCell>
                  {/* <TableCell>
                    {activity.date}
                  </TableCell> */}
                 <TableCell className="text-[#333]">
                      <div className="space-y-1">
                        {activity.procedureDetails && activity.procedureDetails.length > 0 ? (
                          activity.procedureDetails.map((procedure, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span>{procedure.name}</span>
                                {/* {procedure.grade && (
                                  <Badge className="ml-2 bg-[#5C8E77]/10 text-[#5C8E77]">
                                    {procedure.grade}
                                  </Badge>
                                )} */}
                              </div>
                              {/* {procedure.remarks && (
                                <p className="text-xs text-gray-500 italic mt-0.5">
                                  {procedure.remarks}
                                </p>
                              )} */}
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
                          activity.status,
                        )}`}
                      >
                        {activity.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {activity.status !== "Cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-600 hover:bg-blue-50 bg-transparent"
                            onClick={() => {
                              console.log('Opening grade modal for activity:', activity)
                              
                              setCurrentActivity(activity)  
                              setGradeValue(activity.grade || "")
                              setGradeRemarks(activity.remarks || "")
                              setIsGradeModalOpen(true)                              
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {activity.status === "In Progress" && (
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
              ))}
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
             onSave={handleSaveGrades} // but maybe here you only update local state
           />
    </div>
  )
}
