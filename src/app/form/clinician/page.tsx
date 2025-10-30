"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { getUserData, getProcedures, submitAttendanceAction } from "@/app/api/form/clinician/action"
import { ChevronDown, ChevronUp, Clock, Plus, RefreshCw, Eye } from "lucide-react"


interface Procedure {
  procedure_id: string
  name: string
  department: string
}

export interface ProcedureStatus {
  procedure: string
  status: string
  remarks: string
}

export interface RecordInstance {
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  procedureStatuses: ProcedureStatus[]
}

export interface Activity {
  id: string
  patientName: string
  patientType: string
  dateStarted: string | null
  dateEnded: string | null
  procedures: string[]
  procedureDetails?: any[]
  clinicianName: string
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  status: string
  grade?: string
  remarks?: string
  allRecords: RecordInstance[]
  recordCount: number
}

export default function ClinicianForm() {
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
    record_id: "", // Track if this is for an existing record
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([])
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRequestAgainMode, setIsRequestAgainMode] = useState(false) // Track if in "request again" mode

  // In-progress activities
  const [inProgressActivities, setInProgressActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false)
  

  // Group procedures by department
  const proceduresByDepartment = useMemo(() => {
    const grouped: Record<string, Procedure[]> = {}
    
    allProcedures.forEach(procedure => {
      const dept = procedure.department || 'Other'
      if (!grouped[dept]) {
        grouped[dept] = []
      }
      grouped[dept].push(procedure)
    })

    // Sort procedures within each department
    Object.keys(grouped).forEach(dept => {
      grouped[dept].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [allProcedures])

  const departments = useMemo(() => {
    return Object.keys(proceduresByDepartment).sort()
  }, [proceduresByDepartment])

  const fetchInProgressActivities = async (userId: string) => {
    setIsLoadingActivities(true)
    try {
      const response = await fetch('/api/form/pending-activities', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const records = await response.json()

      if (records.error) {
        toast("Error", { description: "Failed to load in-progress activities." })
      } else {
        setInProgressActivities(records.data || [])
      }
    } catch (error) {
      console.error("Error fetching in-progress activities:", error)
      toast("Error", { description: "Failed to load in-progress activities." })
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch user data using server action
        const { error: userError, user, clinician } = await getUserData()
        
        if (userError || !user) {
          console.error("User not authenticated:", userError)
          toast("Authentication Error", { description: "Please log in to continue." })
          return
        }

        if (!clinician) {
          toast("Error", { description: "Failed to load user data." })
          return
        }

        // Set user data
        setFormData((prev) => ({
          ...prev,
          clinicianUserId: user.id,
          firstName: clinician.first_name || "",
          lastName: clinician.last_name || "",
        }))

        // Fetch all procedures using server action
        const { error: procedureError, procedures: procedureData } = await getProcedures()
        
        if (procedureError) {
          toast("Error", { description: "Failed to load procedures." })
        } else {
          setAllProcedures(procedureData)
        }

        // Fetch in-progress activities
        await fetchInProgressActivities(user.id)

      } catch (error) {
        toast("Error", { description: "Failed to load form data." })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleShiftChange = (value: string) => {
    setFormData((prev) => ({ ...prev, shift: value }))
    if (errors.shift) setErrors((prev) => ({ ...prev, shift: "" }))
  }

  const handlePatientType = (value: string) => {
    setFormData((prev) => ({ ...prev, patient_type: value }))
    if (errors.patient_type) setErrors((prev) => ({ ...prev, patient_type: "" }))
  }

  const toggleDepartment = (department: string) => {
    setExpandedDepartments(prev => {
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
    // Don't allow changes in "request again" mode
    if (isRequestAgainMode) {
      return
    }

    setFormData((prev) => {
      let newProcedures = [...prev.selectedProcedures]

      if (checked) {
        if (newProcedures.length >= 2) {
          toast("Limit Reached", { description: "You can only select up to 2 procedures." })
          return prev
        }
        newProcedures.push(procedure)
      } else {
        newProcedures = newProcedures.filter((p) => p !== procedure)
      }

      return { ...prev, selectedProcedures: newProcedures }
    })

    if (errors.procedures) setErrors((prev) => ({ ...prev, procedures: "" }))
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

    setErrors(newErrors)
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
      // Prepare submission data
      const submissionData = {
        patientName: `${formData.patientFirstName} ${formData.patientLastName}`.trim(),
        selectedProcedures: formData.selectedProcedures,
        shift: formData.shift,
        patient_type: formData.patient_type,
        clinicianUserId: formData.clinicianUserId,
        ...(formData.record_id && { record_id: formData.record_id }) // Include record_id if present
      }

      // Use server action
      const result = await submitAttendanceAction(submissionData)

      // Complete progress
      clearInterval(progressInterval)
      setSubmitProgress(100)

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit attendance')
      }

      // Show success message
      const successMessage = isRequestAgainMode 
        ? "Your attendance has been added to the existing record and is pending approval."
        : "Your attendance has been submitted and is pending approval."

      toast("Attendance Submitted", {
        description: successMessage,
      })

      setShowConfirmation(true)

      // Reset form
      setFormData((prev) => ({
        ...prev,
        shift: "",
        patientFirstName: "",
        patientLastName: "",
        selectedProcedures: [],
        patient_type: "",
        record_id: "",
      }))
      setIsRequestAgainMode(false)

      // Refresh in-progress activities
      await fetchInProgressActivities(formData.clinicianUserId)

      // Close modal after brief delay
      setTimeout(() => {
        setShowConfirmation(false)
        setIsViewModalOpen(false)
      }, 2000)

    } catch (error) {
      clearInterval(progressInterval)
      console.error("Submission error:", error)
      
      toast("Submission Failed", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
      setSubmitProgress(0)
    }
  }

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsActivityDetailModalOpen(true)
  }

  const handleRequestAgain = (activity: Activity) => {
    // Pre-fill form with activity data
    const patientNameParts = activity.patientName.split(' ')
    const firstName = patientNameParts[0] || ''
    const lastName = patientNameParts.slice(1).join(' ') || ''

    // Find procedure IDs from procedure names
    const procedureIds = allProcedures
      .filter(p => activity.procedures.includes(p.name))
      .map(p => p.procedure_id)
      .slice(0, 2) // Limit to 2

    setFormData(prev => ({
      ...prev,
      patientFirstName: firstName,
      patientLastName: lastName,
      patient_type: activity.patientType,
      selectedProcedures: procedureIds,
      record_id: activity.id, // Set the record_id
      shift: "", // Reset shift - this is the only field they can change
    }))

    // Enable "request again" mode to lock fields
    setIsRequestAgainMode(true)

    // Close detail modal and open form modal
    setIsActivityDetailModalOpen(false)
    setIsViewModalOpen(true)
    
    toast("Form Pre-filled", {
      description: "The form has been pre-filled. Only the shift can be changed."
    })
  }

  const handleNewRequest = () => {
    // Reset form for new request
    setFormData(prev => ({
      ...prev,
      shift: "",
      patientFirstName: "",
      patientLastName: "",
      selectedProcedures: [],
      patient_type: "",
      record_id: "",
    }))
    setIsRequestAgainMode(false)
    setIsViewModalOpen(true)
  }

  // Get selected procedure names for display
  const selectedProcedureNames = useMemo(() => {
    return allProcedures
      .filter(p => formData.selectedProcedures.includes(p.procedure_id))
      .map(p => `${p.name} (${p.department})`)
  }, [formData.selectedProcedures, allProcedures])

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading form data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-6">

      {/* In-Progress Activities Card */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-[#5C8E77] flex items-center gap-2">
                <Clock className="h-5 w-5" />
                In-Progress Activities
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your activities to be completed.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInProgressActivities(formData.clinicianUserId)}
                disabled={isLoadingActivities}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingActivities ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewRequest}
                className="flex items-center gap-2 bg-[#5C8E77] hover:bg-[#4a7c65] text-white"
              >
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingActivities ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading activities...</p>
            </div>
          ) : inProgressActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No in-progress activities found.</p>
              <p className="text-sm mt-1">Create a new request to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inProgressActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#5C8E77] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {activity.patientName}
                        </h3>
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          {activity.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Patient Type:</span>{' '}
                          <span className="font-medium text-gray-700">{activity.patientType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Records:</span>{' '}
                          <span className="font-medium text-gray-700">{activity.recordCount}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-2">Procedures:</p>
                        <div className="flex flex-wrap gap-2">
                          {activity.procedures.map((proc, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs"
                            >
                              {proc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Latest: {activity.date} at {activity.timeIn}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleViewActivity(activity)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleRequestAgain(activity)}
                        variant="outline"
                        size="sm"
                        className="border-[#5C8E77] text-[#5C8E77] hover:bg-[#5C8E77] hover:text-white"
                      >
                        Request Again
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Detail Modal */}
      <Dialog open={isActivityDetailModalOpen} onOpenChange={setIsActivityDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">
              Activity Details: {selectedActivity?.patientName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-6 mt-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Patient Type</p>
                  <p className="font-medium">{selectedActivity.patientType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="font-medium">{selectedActivity.recordCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Started</p>
                  <p className="font-medium">{selectedActivity.dateStarted || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Latest Date</p>
                  <p className="font-medium">{selectedActivity.dateEnded || 'N/A'}</p>
                </div>
              </div>

              {/* Procedures */}
              <div>
                <h3 className="font-semibold mb-2">Procedures</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedActivity.procedures.map((proc, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-md bg-[#5C8E77] text-white text-sm"
                    >
                      {proc}
                    </span>
                  ))}
                </div>
              </div>

              {/* All Records */}
              <div>
                <h3 className="font-semibold mb-3">Session History</h3>
                <div className="space-y-4">
                  {selectedActivity.allRecords.map((record, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{record.date}</p>
                          <p className="text-sm text-gray-600">
                            {record.timeIn} - {record.timeOut}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Instructor: <span className="font-medium text-gray-700">{record.instructorName}</span></p>
                          <p className="text-gray-500">Chair: <span className="font-medium text-gray-700">{record.chair}</span></p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {record.procedureStatuses.map((ps, psIdx) => (
                          <div key={psIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{ps.procedure}</span>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                ps.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                ps.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {ps.status}
                              </span>
                              {ps.remarks && (
                                <span className="text-xs text-gray-500">{ps.remarks}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => handleRequestAgain(selectedActivity)}
                  className="bg-[#5C8E77] hover:bg-[#4a7c65] text-white"
                >
                  Request Again
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Request Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden border-gray-200 rounded-xl">
          
          {/* Sticky Header */}
          <DialogHeader className="border-b px-6 py-4 sticky top-0 z-10 bg-white">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">
              {isRequestAgainMode ? "Request Again - Add to Existing Record" : "Submit Attendance"}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {isRequestAgainMode 
                ? "This will add a new session to the existing record. Only the shift can be changed."
                : "Fill out this form to initiate attendance. Chair and instructor will be auto-assigned."
              }
            </p>
            {/* {isRequestAgainMode && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700">Most fields are locked. Only shift can be changed.</span>
              </div>
            )} */}
          </DialogHeader>

          {/* Scrollable Form Body */}
          <div className="overflow-y-auto px-6 py-4 space-y-8">

            {/* Success Banner */}
            {showConfirmation && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <svg className="h-5 w-5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Attendance Submitted Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    {isRequestAgainMode 
                      ? "Your attendance has been added to the existing record and is pending approval."
                      : "Your attendance is pending approval. Chair and instructor have been auto-assigned."
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Section 1: Student Info */}
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

            {/* Section 2: Patient Info*/}
            <div className="space-y-5">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-1">
                Patient Information
              </h3>    

              {/* Patient Name */}
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Patient first name"
                      value={formData.patientFirstName}
                      onChange={(e) => !isRequestAgainMode && setFormData({ ...formData, patientFirstName: e.target.value })}
                      disabled={isRequestAgainMode}
                      className={`${errors.patientFirstName ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    />
                    {/* {isRequestAgainMode && (
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )} */}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Patient last name"
                      value={formData.patientLastName}
                      onChange={(e) => !isRequestAgainMode && setFormData({ ...formData, patientLastName: e.target.value })}
                      disabled={isRequestAgainMode}
                      className={`${errors.patientLastName ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    />
                    {/* {isRequestAgainMode && (
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )} */}
                  </div>
                </div>
              </div>

              {/* Patient Type */}
              <div className="space-y-2">
                <Label>Patient Type</Label>
                <div className="relative">
                  <Select 
                    value={formData.patient_type} 
                    onValueChange={handlePatientType}
                    disabled={isRequestAgainMode}
                  >
                    <SelectTrigger className={`${errors.patient_type ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Select patient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* {isRequestAgainMode && (
                    <Lock className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )} */}
                </div>
                {errors.patient_type && <p className="text-sm text-red-500">{errors.patient_type}</p>}
              </div>
            </div>

            {/* Section 3: Procedures */}
            <div className="space-y-5">
              <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-1">Activity Details</h3>
              
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={formData.shift} onValueChange={handleShiftChange}>
                  <SelectTrigger className={`${errors.shift ? "border-red-500" : "focus:border-[#5C8E77]"}`}>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shift && <p className="text-sm text-red-500">{errors.shift}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Procedure</Label>
                  {/* {isRequestAgainMode && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )} */}
                </div>
                <p className="text-sm text-gray-500">
                  {isRequestAgainMode 
                    ? "Procedures are locked and cannot be changed."
                    : "Select up to 2 procedures across any department."
                  }
                </p>

                {formData.selectedProcedures.length > 0 && (
                  <div className={`p-3 border rounded-md ${isRequestAgainMode ? "bg-gray-50 border-gray-200" : "bg-[#5C8E77]/5 border-[#5C8E77]/20"}`}>
                    <p className={`text-xs font-medium mb-2 ${isRequestAgainMode ? "text-gray-600" : "text-[#5C8E77]"}`}>Selected:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcedureNames.map((name, i) => (
                        <span key={i} className={`px-2 py-1 rounded text-xs ${isRequestAgainMode ? "bg-gray-200 text-gray-700" : "bg-[#5C8E77] text-white"}`}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion */}
              {!isRequestAgainMode && (
                <div className="border border-gray-200 rounded-lg divide-y">
                  {departments.map((dept, i) => {
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
              )}
            </div>

            {/* Section 4: Auto-assigned */}
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

            {/* Progress Bar */}
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

          {/* Sticky Footer */}
          <div className="border-t bg-white px-6 py-4 sticky bottom-0">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#5C8E77] hover:bg-[#4a7c65] text-white font-medium py-3"
            >
              {isSubmitting ? "Submitting..." : isRequestAgainMode ? "Submit to Existing Record" : "Submit Attendance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}