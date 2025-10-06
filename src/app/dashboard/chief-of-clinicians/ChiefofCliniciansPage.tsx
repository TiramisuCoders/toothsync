// admin dashboard

// clinician dsitribution
// action column


"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  ChevronDown,
  Plus,
  Edit,
  Check,
  X,
  ChevronUp,
  User,
  Users,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  RockingChair,
  ArchiveRestore,
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import ArchiveConfirmationModal from "@/components/modals/archive-record-modal"
import GradingModal from "@/components/modals/grading-modal"
import UnarchiveConfirmationModal from "@/components/modals/unarchive-record-modal"


// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string
  status?: string
}

interface ClinicianDistribution {
  instructor_id: string
  instructor_name: string
  date: string
  shift: string
  assigned_clinicians: number
}

interface Activity {
  id: string
  firstName?: string
  lastName?: string
  patientName: string
  chair: string
  date: string
  procedures: string[]
  procedureDetails?: ProcedureDetail[]
  status: string
  grade?: string
  assessmentStatus?: string
  remarks?: string
  selectedProcedures?: string[]
  clinicianName: string
  timeIn?: string
  timeOut?: string
  instructorId: string
  instructorName: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  chair?: string
  patient?: string
  instructor?: string
  procedures?: string
  general?: string
}

export interface AdminInfo {
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
  todayTotalActivities1st: number
  todayTotalActivities2nd: number
}


export default function ChiefOfCliniciansPage() {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [gradeValue, setGradeValue] = useState("")
  const [gradeRemarks, setGradeRemarks] = useState("")
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false)
  // Add delete modal state
  const [activityToAction, setActivityToAction] = useState<Activity | null>(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")

  // Form validation states
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
 const [clinicianDistribution, setClinicianDistribution] = useState<ClinicianDistribution[]>([])
  const [AdminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [summary, setSummary] = useState<DashboardSummary>({
    todayCount: 0,
    availableChair1st: 0,
    availableChair2nd: 0,
    instructorsOnDuty1st: 0,
    instructorsOnDuty2nd: 0,
    todayTotalActivities1st: 0,
    todayTotalActivities2nd: 0
  })
  

  // Form state for new activity
  // const [newActivity, setNewActivity] = useState({
  //   firstName: "",
  //   lastName: "",
  //   chair: "",
  //   patient: "",
  //   instructor: "",
  //   procedures: [] as string[],
  //   status: "Not started",
  // })

  const [activities, setAttendanceRecords] = useState<Activity[]>([])

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
      setAttendanceRecords(result.data || [])
      setClinicianDistribution(result.distribution || [])

      
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
        setAdminInfo(userInfo.data)
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

  // Validation function
  // const validateForm = (): boolean => {
  //   const errors: FormErrors = {}

  //   // First name validation
  //   if (!newActivity.firstName.trim()) {
  //     errors.firstName = "First name is required"
  //   } else if (newActivity.firstName.trim().length < 2) {
  //     errors.firstName = "First name must be at least 2 characters"
  //   } else if (!/^[a-zA-Z\s]+$/.test(newActivity.firstName.trim())) {
  //     errors.firstName = "First name can only contain letters and spaces"
  //   }

  //   // Last name validation
  //   if (!newActivity.lastName.trim()) {
  //     errors.lastName = "Last name is required"
  //   } else if (newActivity.lastName.trim().length < 2) {
  //     errors.lastName = "Last name must be at least 2 characters"
  //   } else if (!/^[a-zA-Z\s]+$/.test(newActivity.lastName.trim())) {
  //     errors.lastName = "Last name can only contain letters and spaces"
  //   }

  //   // Chair validation
  //   if (!newActivity.chair) {
  //     errors.chair = "Please select a chair"
  //   }

  //   // Patient validation
  //   if (!newActivity.patient.trim()) {
  //     errors.patient = "Patient name is required"
  //   } else if (newActivity.patient.trim().length < 2) {
  //     errors.patient = "Patient name must be at least 2 characters"
  //   } else if (!/^[a-zA-Z\s]+$/.test(newActivity.patient.trim())) {
  //     errors.patient = "Patient name can only contain letters and spaces"
  //   }

  //   // Instructor validation
  //   if (!newActivity.instructor) {
  //     errors.instructor = "Please select an instructor"
  //   }

  //   // Procedures validation
  //   if (newActivity.procedures.length === 0) {
  //     errors.procedures = "Please select at least one procedure"
  //   }

  //   // Check for duplicate chair assignment (only for active activities)
  //   const activeStatuses = ["Not started", "Started"]
  //   const isChairOccupied = activities.some(
  //     (activity) => activity.chair === newActivity.chair && activeStatuses.includes(activity.status),
  //   )
  //   if (isChairOccupied && newActivity.chair) {
  //     errors.chair = "This chair is already occupied by an active activity"
  //   }

  //   setFormErrors(errors)
  //   return Object.keys(errors).length === 0
  // }

  // Clear form and reset states
  // const resetForm = () => {
  //   setNewActivity({
  //     firstName: "",
  //     lastName: "",
  //     chair: "",
  //     patient: "",
  //     instructor: "",
  //     procedures: [],
  //     status: "Not started",
  //   })
  //   setFormErrors({})
  //   setShowSuccess(false)
  //   setIsSubmitting(false)
  // }

  // Calculate distribution
  const calculateDistribution = (totalClinicians: number, totalInstructors: number) => {
    if (totalInstructors === 0) return []
    const baseCount = Math.floor(totalClinicians / totalInstructors)
    const remainder = totalClinicians % totalInstructors
    const instructors = ["Dr. Reyes", "Dr. Mendoza", "Dr. Santos"]
    return instructors.slice(0, totalInstructors).map((instructor, index) => ({
      instructor,
      clinicians: baseCount + (index < remainder ? 1 : 0),
    }))
  }

  // const instructorDistribution = calculateDistribution(cliniciansLoggedIn, availableInstructors)

  // Get current date
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = today.toLocaleDateString("en-US", options)



  // Handle procedure checkbox changes
  // const handleProcedureChange = (procedure: string, checked: boolean, isEdit = false) => {
  //   if (isEdit && currentActivity) {
  //     const currentProcedures = currentActivity.procedures || [currentActivity.procedure]
  //     let updatedProcedures: string[]
  //     if (checked) {
  //       if (currentProcedures.length < 2) {
  //         updatedProcedures = [...currentProcedures, procedure]
  //       } else {
  //         return // Don't add if already 2 procedures
  //       }
  //     } else {
  //       updatedProcedures = currentProcedures.filter((p) => p !== procedure)
  //     }
  //     setCurrentActivity({
  //       ...currentActivity,
  //       procedures: updatedProcedures,
  //       procedure: updatedProcedures[0] || "",
  //     })
  //   } else {
  //     let updatedProcedures: string[]
  //     if (checked) {
  //       if (newActivity.procedures.length < 2) {
  //         updatedProcedures = [...newActivity.procedures, procedure]
  //       } else {
  //         return // Don't add if already 2 procedures
  //       }
  //     } else {
  //       updatedProcedures = newActivity.procedures.filter((p) => p !== procedure)
  //     }
  //     setNewActivity({
  //       ...newActivity,
  //       procedures: updatedProcedures,
  //     })
  //     // Clear procedure error if user selects a procedure
  //     if (updatedProcedures.length > 0 && formErrors.procedures) {
  //       setFormErrors({ ...formErrors, procedures: undefined })
  //     }
  //   }
  // }

  // Handle creating new activity
  // const handleCreateActivity = async () => {
  //   setIsSubmitting(true)
  //   setFormErrors({})

  //   // Validate form
  //   if (!validateForm()) {
  //     setIsSubmitting(false)
  //     return
  //   }

  //   try {
  //     // Simulate API call delay
  //     await new Promise((resolve) => setTimeout(resolve, 1000))
  //     const newId = (Math.max(...activities.map((a) => Number.parseInt(a.id))) + 1).toString()
  //     const activity: Activity = {
  //       id: newId,
  //       clinicianName: newActivity.clinicianName.trim(),
  //       chair: newActivity.chair,
  //       patient: newActivity.patient.trim(),
  //       instructor: newActivity.instructor,
  //       procedure: newActivity.procedures[0],
  //       procedures: newActivity.procedures,
  //       status: newActivity.status,
  //       archived: false,
  //     }
  //     setActivities([...activities, activity])
  //     setShowSuccess(true)
  //     // Auto-close modal after success message
  //     setTimeout(() => {
  //       setIsModalOpen(false)
  //       resetForm()
  //     }, 2000)
  //   } catch (error) {
  //     setFormErrors({ general: "Failed to create activity. Please try again." })
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

  // Function to handle edit button click
  // const handleEdit = (activity: Activity) => {
  //   setCurrentActivity(activity)
  //   setIsEditModalOpen(true)
  // }

  // const handleCompleteClick = (activity: Activity) => {
  //   setActivityToAction(activity)
  //   setIsCompleteModalOpen(true)
  // }

  // const handleComplete = () => {
  //   if (activityToAction) {
  //     setActivities(
  //       activities.map((activity) =>
  //         activity.id === activityToAction.id ? { ...activity, status: "Completed" } : activity,
  //       ),
  //     )
  //     setIsCompleteModalOpen(false)
  //   }
  // }

  // const handleArchiveClick = (activity: Activity) => {
  //   setActivityToAction(activity)
  //   setIsArchiveModalOpen(true)
  // }

  // const handleArchive = () => {
  //   if (activityToAction) {
  //     setActivities(
  //       activities.map((activity) =>
  //         activity.id === activityToAction.id ? { ...activity, archived: true } : activity,
  //       ),
  //     )
  //     setIsArchiveModalOpen(false)
  //   }
  // }

  // Function to update activity
  // const handleUpdateActivity = (updatedActivity: Activity) => {
  //   setActivities(activities.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity)))
  //   setIsEditModalOpen(false)
  // }

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle modal close
  // const handleModalClose = (open: boolean) => {
  //   if (!open) {
  //     resetForm()
  //   }
  //   setIsModalOpen(open)
  // }

  // Handle input changes with error clearing
  // const handleInputChange = (field: keyof typeof newActivity, value: string) => {
  //   setNewActivity({ ...newActivity, [field]: value })
  //   // Clear specific field error when user starts typing
  //   if (formErrors[field as keyof FormErrors]) {
  //     setFormErrors({ ...formErrors, [field]: undefined })
  //   }
  // }

  // Sort activities
  const sortedActivities = [...activities]
    .filter((activity) => !activity.archived)
    .sort((a, b) => {
      if (sortField === "id") {
        return sortDirection === "asc"
          ? Number.parseInt(a.id) - Number.parseInt(b.id)
          : Number.parseInt(b.id) - Number.parseInt(a.id)
      } else if (sortField === "lastName") {
        return sortDirection === "asc" ? a.clinicianName.localeCompare(b.clinicianName) : b.clinicianName.localeCompare(a.clinicianName)
      }
      return 0
    })

  const [loggedAdmin, setLoggedAdmin] = useState<string | null>(null)

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
  
        setAttendanceRecords(
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
  const handleUnarchiveClick = (activity: Activity) => {
    setCurrentActivity(activity)
    setIsUnarchiveModalOpen(true)
  }

  const handleUnarchive = async () => {
    if (!currentActivity) return

    try {
      const res = await fetch("/api/activities/archive-activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: currentActivity.id,
          status: "In Progress", // or "Incomplete" if that's the exact enum in DB
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        console.error("❌ Restoring failed:", result)
        toast({
          title: "Error",
          description: "Failed to update activity status.",
          variant: "destructive",
        })
        return
      }

      setAttendanceRecords(
        activities.map((activity) =>
          activity.id === currentActivity.id
            ? { ...activity, status: "In Progress" } // match DB status
            : activity
        )
      )

      setIsUnarchiveModalOpen(false)
      toast({
        title: "Activity Restored",
        description: `Activity ${currentActivity.id} has been restored.`,
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
      setAttendanceRecords(activities.map(activity => 
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

  // compute groups & maxima (place above return in your component)
const shift1 = (clinicianDistribution ?? []).filter(i => i.shift === "1st");
const shift2 = (clinicianDistribution ?? []).filter(i => i.shift === "2nd");

const max1 = Math.max(1, ...shift1.map(i => i.assigned_clinicians)); // avoid div-by-zero
const max2 = Math.max(1, ...shift2.map(i => i.assigned_clinicians));



  if (!AdminInfo) {
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

  console.log(clinicianDistribution)

  return (
    <div className="flex h-full bg-[#f8f9fa]" style={poppinsFont}>
      <div className="w-full">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#333]">{greeting}, {AdminInfo.name}!</h2>
          <p className="text-gray-500">{formattedDate}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 uppercase mb-4">TODAY'S ACTIVITIES</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 1</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.todayTotalActivities1st}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Shift 2</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">
                    {summary.todayTotalActivities1st}
                  </h3>
                </div>
                <div className="bg-[#e6f7eb] p-3 rounded-full">
                  <Calendar className="h-5 w-5 text-[#5C8E77]" />
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
            </div>
          </CardContent>
          </Card>
          
          
        </div>

        

       {/* Instructor-Clinician Distribution */}
<Card className="bg-white border border-gray-200 shadow-sm mb-6">
  <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
    <div>
      <CardTitle className="text-xl font-semibold text-[#333]">Clinician Distribution</CardTitle>
      <p className="text-sm text-gray-500 mt-1">
        1st Shift: {summary.todayTotalActivities1st} clinicians / {summary.instructorsOnDuty1st} instructors &nbsp;|&nbsp;
        2nd Shift: {summary.todayTotalActivities2nd} clinicians / {summary.instructorsOnDuty2nd} instructors
      </p>
    </div>
  </CardHeader>

  <CardContent className="p-0">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* 1st Shift Column */}
      <div>
        <h3 className="text-md font-semibold text-[#333] mb-2">1st Shift</h3>
        <Table>
          <TableHeader className="bg-white border-b border-gray-200">
            <TableRow>
              <TableHead className="font-medium text-[#333]">Instructor</TableHead>
              <TableHead className="font-medium text-[#333] text-right">Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shift1.length > 0 ? (
              shift1.map((item, index) => {
                const pct = Math.round((item.assigned_clinicians / max1) * 100);
                return (
                  <TableRow key={`1st-${item.instructor_id}-${index}`} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{item.instructor_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-[#333]">{item.assigned_clinicians}</span>

                        <div className="w-36 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#5C8E77] h-2.5 rounded-full"
                            style={{ width: `${pct}%` }}
                            aria-hidden="true"
                          />
                        </div>

                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-gray-500">
                  No instructors on 1st shift today.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 2nd Shift Column */}
      <div>
        <h3 className="text-md font-semibold text-[#333] mb-2">2nd Shift</h3>
        <Table>
          <TableHeader className="bg-white border-b border-gray-200">
            <TableRow>
              <TableHead className="font-medium text-[#333]">Instructor</TableHead>
              <TableHead className="font-medium text-[#333] text-right">Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shift2.length > 0 ? (
              shift2.map((item, index) => {
                const pct = Math.round((item.assigned_clinicians / max2) * 100);
                return (
                  <TableRow key={`2nd-${item.instructor_id}-${index}`} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{item.instructor_name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-[#333]">{item.assigned_clinicians}</span>

                        <div className="w-36 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#5C8E77] h-2.5 rounded-full"
                            style={{ width: `${pct}%` }}
                            aria-hidden="true"
                          />
                        </div>

                        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-gray-500">
                  No instructors on 2nd shift today.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </CardContent>
</Card>




        {/* Activities Table */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <CardTitle className="text-xl font-semibold text-[#333]">Today's Activities</CardTitle>
            </div>
            {/* <Button
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> New Activity
            </Button> */}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white border-b border-gray-200">
                <TableRow className="hover:bg-white border-b-0">
                  <TableHead className="font-medium text-[#333] cursor-pointer" onClick={() => handleSort("id")}>
                    <div className="flex items-center">
                      Act ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "id" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  {/* <TableHead className="font-medium text-[#333]">Clinician</TableHead> */}
                  <TableHead className="font-medium text-[#333] cursor-pointer" onClick={() => handleSort("lastName")}>
                    <div className="flex items-center">
                      Clinician
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "clinicianName" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="font-medium text-[#333]">Chair</TableHead>
                  <TableHead className="font-medium text-[#333]">Instructor</TableHead>
                  <TableHead className="font-medium text-[#333]">Procedure</TableHead>
                  <TableHead className="font-medium text-[#333]">Status</TableHead>
                  <TableHead className="font-medium text-[#333]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedActivities.length > 0 ? (
                  sortedActivities.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="font-medium text-[#333]">{activity.id}</TableCell>
                      {/* <TableCell className="text-[#333]">{activity.firstName}</TableCell> */}
                      <TableCell className="text-[#333]">{activity.clinicianName}</TableCell>
                      <TableCell className="text-[#333]">{activity.chair}</TableCell>
                      <TableCell className="text-[#333]">{activity.instructorName}</TableCell>
                      <TableCell className="text-[#333]">
                        {activity.procedures ? (
                          <div className="space-y-1">
                            {activity.procedures.map((proc, index) => (
                              <div key={index} className="text-sm">
                                {proc}
                              </div>
                            ))}
                          </div>
                        ) : (
                          activity.procedures
                        )}
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
                                // setActivityToGrade(activity)
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
                          {activity.status === "Cancelled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleUnarchiveClick(activity)}
                            >
                              <ArchiveRestore  className="h-4 w-4" />
                            </Button>
                          )}
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      No activities scheduled for today.
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
          onSave={handleSaveGrades} // but maybe here you only update local state
        />
        
        <UnarchiveConfirmationModal
          isOpen={isUnarchiveModalOpen}
          onClose={() => setIsUnarchiveModalOpen(false)}
          onConfirm={handleUnarchive}
          activity={currentActivity}
        />

        {/* New Activity Modal */}
        {/* <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
            <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-[#5C8E77]">New Activity</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto"> */}
              {/* Success Message */}
              {/* {showSuccess && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Activity created successfully! The modal will close automatically.
                  </AlertDescription>
                </Alert>
              )} */}
              {/* General Error Message */}
              {/* {formErrors.general && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{formErrors.general}</AlertDescription>
                </Alert>
              )} */}
              {/* <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#333]">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      className={`border-gray-300 ${formErrors.firstName ? "border-red-500 focus:border-red-500" : ""}`}
                      value={newActivity.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={isSubmitting}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#333]">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      className={`border-gray-300 ${formErrors.lastName ? "border-red-500 focus:border-red-500" : ""}`}
                      value={newActivity.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={isSubmitting}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chair" className="text-[#333]">
                      Chair <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newActivity.chair}
                      onValueChange={(value) => {
                        setNewActivity({ ...newActivity, chair: value })
                        if (formErrors.chair) {
                          setFormErrors({ ...formErrors, chair: undefined })
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="chair"
                        className={`border-gray-300 ${formErrors.chair ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select chair" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chair 03">Chair 03</SelectItem>
                        <SelectItem value="Chair 05">Chair 05</SelectItem>
                        <SelectItem value="Chair 08">Chair 08</SelectItem>
                        <SelectItem value="Chair 10">Chair 10</SelectItem>
                        <SelectItem value="Chair 12">Chair 12</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.chair && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.chair}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor" className="text-[#333]">
                      Instructor <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newActivity.instructor}
                      onValueChange={(value) => {
                        setNewActivity({ ...newActivity, instructor: value })
                        if (formErrors.instructor) {
                          setFormErrors({ ...formErrors, instructor: undefined })
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="instructor"
                        className={`border-gray-300 ${formErrors.instructor ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Reyes">Dr. Reyes</SelectItem>
                        <SelectItem value="Dr. Mendoza">Dr. Mendoza</SelectItem>
                        <SelectItem value="Dr. Santos">Dr. Santos</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.instructor && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.instructor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient" className="text-[#333]">
                    Patient <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patient"
                    placeholder="Enter patient name"
                    className={`border-gray-300 ${formErrors.patient ? "border-red-500 focus:border-red-500" : ""}`}
                    value={newActivity.patient}
                    onChange={(e) => handleInputChange("patient", e.target.value)}
                    disabled={isSubmitting}
                  />
                  {formErrors.patient && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.patient}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="procedure" className="text-[#333]">
                    Procedures (Select up to 2) <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Root Canal Treatment",
                      "Dental Filling",
                      "Dental Crown",
                      "Teeth Cleaning",
                      "Dental Extraction",
                    ].map((procedure) => (
                      <div key={procedure} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={procedure.toLowerCase().replace(/\s+/g, "-")}
                          className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                          checked={newActivity.procedures.includes(procedure)}
                          onChange={(e) => handleProcedureChange(procedure, e.target.checked)}
                          disabled={
                            (!newActivity.procedures.includes(procedure) && newActivity.procedures.length >= 2) ||
                            isSubmitting
                          }
                        />
                        <label htmlFor={procedure.toLowerCase().replace(/\s+/g, "-")} className="text-sm text-gray-700">
                          {procedure}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formErrors.procedures && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.procedures}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">You can select up to 2 procedures per activity.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[#333]">
                    Status
                  </Label>
                  <Select
                    value={newActivity.status}
                    onValueChange={(value) => setNewActivity({ ...newActivity, status: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="status" className="border-gray-300">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not started">Not started</SelectItem>
                      <SelectItem value="Started">Started</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => handleModalClose(false)}
                className="border-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                onClick={handleCreateActivity}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Create Activity"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}

        
      </div>
    </div>
  )
}
