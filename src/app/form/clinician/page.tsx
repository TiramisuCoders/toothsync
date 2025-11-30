"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { getUserData, getProcedures, submitAttendanceAction } from "@/app/api/form/clinician/action"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  procedures: string[]
  status: string
  date: string
  timeIn: string
  recordCount: number
  dateStarted?: string
  dateEnded?: string
  allRecords: RecordInstance[]
}

export interface Procedure {
  procedure_id: string
  name: string
  department: string
}

export default function ClinicianForm() {
  const [mainTab, setMainTab] = useState<"submit" | "submissions">("submit")
  const [submissionTab, setSubmissionTab] = useState<"in-progress" | "approved" | "cancelled" | "denied" | "all">(
    "in-progress",
  )

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
    record_id: "",
    requestDate: new Date().toISOString().split("T")[0],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([])
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRequestAgainMode, setIsRequestAgainMode] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

  const [inProgressActivities, setInProgressActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false)

  const [submittedRequests, setSubmittedRequests] = useState<Activity[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [inProgressCurrentPage, setInProgressCurrentPage] = useState(1)
  const [inProgressItemsPerPage, setInProgressItemsPerPage] = useState(10)
  const [submissionsCurrentPage, setSubmissionsCurrentPage] = useState(1)
  const [submissionsItemsPerPage, setSubmissionsItemsPerPage] = useState(10)

  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [statusChangeRequest, setStatusChangeRequest] = useState<{ activity: Activity; newStatus: string } | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

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

  const filteredSubmissions = useMemo(() => {
    const approved = submittedRequests.filter((r) => r.status === "Approved")
    const cancelled = submittedRequests.filter((r) => r.status === "Cancelled")
    const pending = submittedRequests.filter((r) => r.status === "Pending")
    const denied = submittedRequests.filter((r) => r.status === "Denied") // Add Denied filter

    return {
      approved,
      cancelled,
      pending,
      denied, // Include denied in the returned object
      all: submittedRequests,
    }
  }, [submittedRequests])

  const handleShiftChange = (value: string) => {
    setFormData((prev) => ({ ...prev, shift: value }))
    if (errors.shift) setErrors((prev) => ({ ...prev, shift: "" }))
  }

  const handlePatientType = (value: string) => {
    setFormData((prev) => ({ ...prev, patient_type: value }))
    if (errors.patient_type) setErrors((prev) => ({ ...prev, patient_type: "" }))
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
      const submissionData = {
        patientName: `${formData.patientFirstName} ${formData.patientLastName}`.trim(),
        selectedProcedures: formData.selectedProcedures,
        shift: formData.shift,
        patient_type: formData.patient_type,
        clinicianUserId: formData.clinicianUserId,
        requestDate: formData.requestDate,
        ...(formData.record_id && { record_id: formData.record_id }),
      }

      const result = await submitAttendanceAction(submissionData)

      clearInterval(progressInterval)
      setSubmitProgress(100)

      if (!result.success) {
        throw new Error(result.error || "Failed to submit request")
      }

      const successMessage = isRequestAgainMode
        ? "Your request has been added to the existing record and is pending approval."
        : "Your request has been submitted and is pending approval."

      toast("Attendance Submitted", {
        description: successMessage,
      })

      setFormData((prev) => ({
        ...prev,
        shift: "",
        patientFirstName: "",
        patientLastName: "",
        selectedProcedures: [],
        patient_type: "",
        record_id: "",
        requestDate: new Date().toISOString().split("T")[0],
      }))
      setIsRequestAgainMode(false)

      await fetchInProgressActivities(formData.clinicianUserId)
      await fetchSubmittedRequests(formData.clinicianUserId)

      setTimeout(() => {
        setIsViewModalOpen(false)
        setIsSuccessModalOpen(true)
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
    const patientNameParts = activity.patientName.split(" ")
    const firstName = patientNameParts[0] || ""
    const lastName = patientNameParts.slice(1).join(" ") || ""

    const procedureIds = allProcedures
      .filter((p) => activity.procedures.includes(p.name))
      .map((p) => p.procedure_id)
      .slice(0, 2)

    setFormData((prev) => ({
      ...prev,
      patientFirstName: firstName,
      patientLastName: lastName,
      patient_type: activity.patientType,
      selectedProcedures: procedureIds,
      record_id: activity.id,
      shift: "",
      requestDate: activity.date, // Use the activity's date as the request date
    }))

    setIsRequestAgainMode(true)

    setIsActivityDetailModalOpen(false)
    setIsViewModalOpen(true)

    toast("Form Pre-filled", {
      description: "The form has been pre-filled. Only the shift can be changed.",
    })
  }

  const handleNewRequest = () => {
    setFormData((prev) => ({
      ...prev,
      shift: "",
      patientFirstName: "",
      patientLastName: "",
      selectedProcedures: [],
      patient_type: "",
      record_id: "",
      requestDate: new Date().toISOString().split("T")[0], // Reset to today's date
    }))
    setIsRequestAgainMode(false)
    setIsViewModalOpen(true)
  }

  const selectedProcedureNames = useMemo(() => {
    return allProcedures
      .filter((p) => formData.selectedProcedures.includes(p.procedure_id))
      .map((p) => `${p.name} (${p.department})`)
  }, [formData.selectedProcedures, allProcedures])

  const fetchInProgressActivities = async (userId: string) => {
    setIsLoadingActivities(true)
    try {
      const response = await fetch("/api/form/pending-activities", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const records = await response.json()

      if (records.error) {
        toast("Error", { description: "Failed to load in-progress activities." })
      } else {
        setInProgressActivities(records.data || [])
        setInProgressCurrentPage(1)
      }
    } catch (error) {
      console.error("Error fetching in-progress activities:", error)
      toast("Error", { description: "Failed to load in-progress activities." })
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const fetchSubmittedRequests = async (userId: string) => {
    setIsLoadingSubmissions(true)
    try {
      const response = await fetch("/api/form/submitted-requests", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const records = await response.json()

      if (records.error) {
        toast("Error", { description: "Failed to load submitted requests." })
      } else {
        setSubmittedRequests(records.data || [])
        setSubmissionsCurrentPage(1)
      }
    } catch (error) {
      console.error("Error fetching submitted requests:", error)
      toast("Error", { description: "Failed to load submitted requests." })
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
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

        setFormData((prev) => ({
          ...prev,
          clinicianUserId: user.id,
          firstName: clinician.first_name || "",
          lastName: clinician.last_name || "",
        }))

        const { error: procedureError, procedures: procedureData } = await getProcedures()

        if (procedureError) {
          toast("Error", { description: "Failed to load procedures." })
        } else {
          setAllProcedures(procedureData)
        }

        await fetchInProgressActivities(user.id)
        await fetchSubmittedRequests(user.id)
      } catch (error) {
        toast("Error", { description: "Failed to load form data." })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    const statusColors = {
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Approved: "bg-green-100 text-green-700 border-green-200",
      Cancelled: "bg-red-100 text-red-700 border-red-200",
      Denied: "bg-orange-100 text-orange-700 border-orange-200",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const handleStatusDropdownChange = (activity: Activity, newStatus: string) => {
    if (newStatus === activity.status) return
    setStatusChangeRequest({ activity, newStatus })
    setIsStatusConfirmOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!statusChangeRequest) return

    setIsChangingStatus(true)
    try {
      const response = await fetch(`/api/form/submitted-requests`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: statusChangeRequest.activity.id,
          status: statusChangeRequest.newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        toast("Error", { description: "Failed to update status." })
      } else {
        toast("Status Updated", {
          description: `Request ${statusChangeRequest.activity.id} status changed to ${statusChangeRequest.newStatus}.`,
        })

        await fetchSubmittedRequests(formData.clinicianUserId)
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast("Error", { description: "Failed to update status. Please try again." })
    } finally {
      setIsChangingStatus(false)
      setIsStatusConfirmOpen(false)
      setStatusChangeRequest(null)
    }
  }

  const renderInProgressTable = (
    activities: Activity[],
    emptyMessage: string,
    currentPage: number,
    itemsPerPage: number,
    onPageChange: (page: number) => void,
    onItemsPerPageChange: (items: number) => void,
  ) => {
    const filteredActivities = activities.filter((activity) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        activity.id.toLowerCase().includes(searchLower) ||
        activity.patientName.toLowerCase().includes(searchLower) ||
        activity.patientType.toLowerCase().includes(searchLower) ||
        activity.procedures.some((p) => p.toLowerCase().includes(searchLower))
      )
    })

    if (filteredActivities.length === 0) {
      return (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{searchQuery ? "No matching results found" : emptyMessage}</p>
        </div>
      )
    }

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = filteredActivities.slice(startIndex, endIndex)

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Request ID</TableHead>
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Procedure Type</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Procedures</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((activity) => (
              <TableRow key={activity.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{activity.id}</TableCell>
                <TableCell className="font-medium">{activity.patientName}</TableCell>
                <TableCell>{activity.patientType}</TableCell>
                <TableCell>{activity.date}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {activity.procedures.slice(0, 2).map((proc, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 break-words">
                        {proc}
                      </span>
                    ))}
                    {activity.procedures.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 break-words">
                        +{activity.procedures.length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {activity.status === "In Progress" && (
                      <Button
                        onClick={() => handleViewActivity(activity)}
                        variant="ghost"
                        size="sm"
                        className="text-[#5C8E77] hover:text-[#406E58] hover:bg-[#5C8E77]/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleRequestAgain(activity)}
                      variant="ghost"
                      size="sm"
                      className="text-[#5C8E77] hover:text-[#406E58] hover:bg-[#5C8E77]/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredActivities.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredActivities.length)} of{" "}
                {filteredActivities.length} entries
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRequestsTable = (
    activities: Activity[],
    emptyMessage: string,
    currentPage: number,
    itemsPerPage: number,
    onPageChange: (page: number) => void,
    onItemsPerPageChange: (items: number) => void,
  ) => {
    const filteredActivities = activities.filter((activity) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        activity.id.toLowerCase().includes(searchLower) ||
        activity.patientName.toLowerCase().includes(searchLower) ||
        activity.patientType.toLowerCase().includes(searchLower) ||
        activity.procedures.some((p) => p.toLowerCase().includes(searchLower))
      )
    })

    if (filteredActivities.length === 0) {
      return (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{searchQuery ? "No matching results found" : emptyMessage}</p>
        </div>
      )
    }

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = filteredActivities.slice(startIndex, endIndex)

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Request ID</TableHead>
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Procedure Type</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Procedures</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((activity) => (
              <TableRow key={activity.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{activity.id}</TableCell>
                <TableCell className="font-medium">{activity.patientName}</TableCell>
                <TableCell>{activity.patientType}</TableCell>
                <TableCell>{activity.date}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {activity.procedures.slice(0, 2).map((proc, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 break-words">
                        {proc}
                      </span>
                    ))}
                    {activity.procedures.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 break-words">
                        +{activity.procedures.length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={activity.status}
                    onValueChange={(value) => handleStatusDropdownChange(activity, value)}
                    disabled={
                      activity.status === "Approved" || activity.status === "Cancelled" || activity.status === "Denied"
                    }
                  >
                    <SelectTrigger
                      className={`w-[130px] ${getStatusColor(activity.status)} border ${
                        activity.status === "Approved" ||
                        activity.status === "Cancelled" ||
                        activity.status === "Denied"
                          ? "opacity-70 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder={activity.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {activity.status === "Pending" && (
                        <>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="Denied">Denied</SelectItem> {/* Add Denied option */}
                        </>
                      )}
                      {activity.status === "Approved" && <SelectItem value="Approved">Approved</SelectItem>}
                      {activity.status === "Cancelled" && <SelectItem value="Cancelled">Cancelled</SelectItem>}
                      {activity.status === "Denied" && <SelectItem value="Denied">Denied</SelectItem>}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredActivities.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredActivities.length)} of{" "}
                {filteredActivities.length} entries
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
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

  const openNewRequestModal = () => {
    // Reset form data for new request
    setFormData({
      ...formData,
      patientFirstName: "",
      patientLastName: "",
      patient_type: "",
      shift: "",
      selectedProcedures: [],
      requestDate: new Date().toISOString().split("T")[0],
    })
    setErrors({})
    setIsRequestAgainMode(false)
    setIsViewModalOpen(true)
  }

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Requests</h1>
        </div>
        <Button onClick={openNewRequestModal} className="bg-[#5C8E77] hover:bg-[#406E58] text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(value) => setMainTab(value as "submit" | "submissions")}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="submit">In Progress Activities</TabsTrigger>
          <TabsTrigger value="submissions">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                    <Clock className="h-5 w-5" />
                    In-Progress Activities
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Your activities to be completed. Create a new request or add to an existing one.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchInProgressActivities(formData.clinicianUserId)}
                    disabled={isLoadingActivities}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingActivities ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading activities...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by request ID, patient name, type, or procedures..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {renderInProgressTable(
                    inProgressActivities,
                    "No in-progress activities found. Create a new request to get started.",
                    inProgressCurrentPage,
                    inProgressItemsPerPage,
                    setInProgressCurrentPage,
                    setInProgressItemsPerPage,
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Tabs value={submissionTab} onValueChange={(value) => setSubmissionTab(value as any)} className="space-y-6">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="in-progress">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              <TabsTrigger value="denied">Denied</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                        <FileText className="h-5 w-5" />
                        All Requests
                      </CardTitle>
                      <CardDescription className="text-gray-600">View all your submitted requests.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSubmittedRequests(formData.clinicianUserId)}
                        disabled={isLoadingSubmissions}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by request ID, patient name, type, or procedures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      {renderRequestsTable(
                        submittedRequests,
                        "No requests found.",
                        submissionsCurrentPage,
                        submissionsItemsPerPage,
                        setSubmissionsCurrentPage,
                        setSubmissionsItemsPerPage,
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="in-progress">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                        <Clock className="h-5 w-5" />
                        Pending Requests
                      </CardTitle>
                      <CardDescription className="text-gray-600">Your requests awaiting approval.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSubmittedRequests(formData.clinicianUserId)}
                        disabled={isLoadingSubmissions}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by request ID, patient name, type, or procedures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      {renderRequestsTable(
                        submittedRequests.filter((r) => r.status === "Pending"),
                        "No pending requests found.",
                        submissionsCurrentPage,
                        submissionsItemsPerPage,
                        setSubmissionsCurrentPage,
                        setSubmissionsItemsPerPage,
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                        <CheckCircle className="h-5 w-5" />
                        Approved Requests
                      </CardTitle>
                      <CardDescription className="text-gray-600">Your approved requests.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                     
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSubmittedRequests(formData.clinicianUserId)}
                        disabled={isLoadingSubmissions}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by request ID, patient name, type, or procedures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      {renderRequestsTable(
                        submittedRequests.filter((r) => r.status === "Approved"),
                        "No approved requests found.",
                        submissionsCurrentPage,
                        submissionsItemsPerPage,
                        setSubmissionsCurrentPage,
                        setSubmissionsItemsPerPage,
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cancelled">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                        <XCircle className="h-5 w-5" />
                        Cancelled Requests
                      </CardTitle>
                      <CardDescription className="text-gray-600">Your cancelled requests.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSubmittedRequests(formData.clinicianUserId)}
                        disabled={isLoadingSubmissions}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by request ID, patient name, type, or procedures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      {renderRequestsTable(
                        submittedRequests.filter((r) => r.status === "Cancelled"),
                        "No cancelled requests found.",
                        submissionsCurrentPage,
                        submissionsItemsPerPage,
                        setSubmissionsCurrentPage,
                        setSubmissionsItemsPerPage,
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="denied">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                        <XCircle className="h-5 w-5" />
                        Denied Requests
                      </CardTitle>
                      <CardDescription className="text-gray-600">Your requests denied by clerks.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSubmittedRequests(formData.clinicianUserId)}
                        disabled={isLoadingSubmissions}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by request ID, patient name, type, or procedures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      {renderRequestsTable(
                        submittedRequests.filter((r) => r.status === "Denied"),
                        "No denied requests found.",
                        submissionsCurrentPage,
                        submissionsItemsPerPage,
                        setSubmissionsCurrentPage,
                        setSubmissionsItemsPerPage,
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <Dialog open={isActivityDetailModalOpen} onOpenChange={setIsActivityDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">
              Activity Details: {selectedActivity?.patientName}
            </DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-6 mt-4">
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
                  <p className="font-medium">{selectedActivity.dateStarted || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Latest Date</p>
                  <p className="font-medium">{selectedActivity.dateEnded || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Procedures</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedActivity.procedures.map((proc, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-md bg-[#5C8E77] text-white text-sm">
                      {proc}
                    </span>
                  ))}
                </div>
              </div>

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
                          <p className="text-gray-500">
                            Instructor: <span className="font-medium text-gray-700">{record.instructorName}</span>
                          </p>
                          <p className="text-gray-500">
                            Chair: <span className="font-medium text-gray-700">{record.chair}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {record.procedureStatuses.map((ps, psIdx) => (
                          <div key={psIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{ps.procedure}</span>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  ps.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : ps.status === "In Progress"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {ps.status}
                              </span>
                              {ps.remarks && <span className="text-xs text-gray-500">{ps.remarks}</span>}
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden border-gray-200 rounded-xl">
          <DialogHeader className="border-b px-6 py-4 sticky top-0 z-10 bg-white">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">
              {isRequestAgainMode ? "Request Again - Add to Existing Record" : "Submit Request"}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {isRequestAgainMode
                ? "This will add a new session to the existing record. Only the shift can be changed."
                : "Fill out this form to initiate request. Chair and instructor will be auto-assigned."}
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
                      onChange={(e) =>
                        !isRequestAgainMode && setFormData({ ...formData, patientFirstName: e.target.value })
                      }
                      disabled={isRequestAgainMode}
                      className={`${errors.patientFirstName ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Patient last name"
                      value={formData.patientLastName}
                      onChange={(e) =>
                        !isRequestAgainMode && setFormData({ ...formData, patientLastName: e.target.value })
                      }
                      disabled={isRequestAgainMode}
                      className={`${errors.patientLastName ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Patient Type</Label>
                <div className="relative">
                  <Select value={formData.patient_type} onValueChange={handlePatientType} disabled={isRequestAgainMode}>
                    <SelectTrigger
                      className={`${errors.patient_type ? "border-red-500" : "focus:border-[#5C8E77]"} ${isRequestAgainMode ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    >
                      <SelectValue placeholder="Select patient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.patient_type && <p className="text-sm text-red-500">{errors.patient_type}</p>}
              </div>
            </div>

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
                <p className="text-sm text-gray-500">
                  {isRequestAgainMode
                    ? "Procedures are locked and cannot be changed."
                    : "Select up to 2 procedures across any department."}
                </p>

                {formData.selectedProcedures.length > 0 && (
                  <div
                    className={`p-3 border rounded-md ${isRequestAgainMode ? "bg-gray-50 border-gray-200" : "bg-[#5C8E77]/5 border-[#5C8E77]/20"}`}
                  >
                    <p
                      className={`text-xs font-medium mb-2 ${isRequestAgainMode ? "text-gray-600" : "text-[#5C8E77]"}`}
                    >
                      Selected:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcedureNames.map((name, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 rounded text-xs ${isRequestAgainMode ? "bg-gray-200 text-gray-700" : "bg-[#5C8E77] text-white"}`}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isRequestAgainMode && (
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
              )}
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
              {isSubmitting ? "Submitting..." : isRequestAgainMode ? "Submit to Existing Record" : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md text-center space-y-4 py-8">
          <DialogHeader>
            <DialogTitle className="text-green-700 text-lg font-semibold">
              Request Submitted Successfully!
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-3">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-gray-600">
              {isRequestAgainMode
                ? "Your request has been added to the existing record and is pending approval."
                : "Your request has been submitted and is pending approval. Chair and instructor have been auto-assigned."}
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

      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Change Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change the status of request <strong>{statusChangeRequest?.activity.id}</strong>{" "}
            for patient <strong>{statusChangeRequest?.activity.patientName}</strong> from{" "}
            <strong>{statusChangeRequest?.activity.status}</strong> to <strong>{statusChangeRequest?.newStatus}</strong>
            ?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              disabled={isChangingStatus}
              className="bg-[#5C8E77] hover:bg-[#406E58]"
            >
              {isChangingStatus ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
