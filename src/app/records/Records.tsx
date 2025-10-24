"use client"

import { useEffect, useState } from "react"
import { X, Pencil, ChevronLeft, ChevronRight, ArchiveRestore, FileText, Download, Eye } from "lucide-react"
import { Card, CardContent} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import ArchiveConfirmationModal from "@/components/modals/archive-record-modal"
import GradingModal from "@/components/modals/grading-modal"
import UnarchiveConfirmationModal from "@/components/modals/unarchive-record-modal"

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

type UserRole = 'R01' | 'R03' | 'R04' // Clinician, Instructor, Admin

export default function UnifiedActivitiesRecords() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  
  // Filters
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  // const [activeTab, setActiveTab] = useState("activities")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Data
  const [activities, setActivitiesRecords] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/records', {
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
      
      if (records.success) {
        setActivitiesRecords(records.data)
        // Get user role from the response if available
        // You might need to add this to your API response
        setUserRole(records.userRole) // Default to clinician if not provided
        console.log(userRole)
      } else {
        throw new Error(records.error || 'Failed to fetch records')
      }
    } catch (err) {
      console.error('Error fetching records:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }

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
          status: "Cancelled",
        }),
      })

      const result = await res.json()
      if (!res.ok) {
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
    } catch (error) {
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
          status: "In Progress",
        }),
      })

      const result = await res.json()
      if (!res.ok) {
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
            ? { ...activity, status: "In Progress" }
            : activity
        )
      )

      setIsUnarchiveModalOpen(false)
      toast({
        title: "Activity Restored",
        description: `Activity ${currentActivity.id} has been restored.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleProcedureGradeChange = (index: number, field: 'status' | 'remarks', value: string) => {
    if (!currentActivity) return

    const updatedProcedureDetails = [...(currentActivity.procedureDetails || [])]
    if (!updatedProcedureDetails[index]) {
      updatedProcedureDetails[index] = {
        name: currentActivity.procedures[index],
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
      const procedureUpdates = currentActivity.procedureDetails.map(async (procedure) => {
        if (procedure.status && String(procedure.status || "").trim() !== "") {
          const response = await fetch('/api/activities/clinical-instructor', {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              record_id: currentActivity.id,
              procedure_name: procedure.name,
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
      const allCompleted = updatedProcedures.every(p => p.status === "Completed")

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

  const filteredActivities = activities.filter((record) => {
    let matchesDate = true
    let matchesStatus = true

    if (dateFilter === "today") {
      const recordDate = new Date(record.date).toDateString()
      const today = new Date().toDateString()
      matchesDate = recordDate === today
    } else if (dateFilter === "custom" && customDate) {
      matchesDate = record.date === customDate
    }

    if (activeFilter === "in progress") {
      matchesStatus = record.status.toLowerCase() === "in progress"
    } else if (activeFilter === "completed") {
      matchesStatus = record.status.toLowerCase() === "completed"
    } else if (activeFilter === "cancelled") {
      matchesStatus = record.status.toLowerCase() === "cancelled"
    }

    return matchesDate && matchesStatus
  })

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredActivities.slice(startIndex, endIndex)

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading records...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine if user can edit (only instructors)
  const canEdit = userRole === 'R03'
  const isChief = userRole === 'R04'
  const isInstructor = userRole === 'R03'
  const isClinician = userRole === 'R01'

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="link"
              className="p-0 h-auto ml-2 text-red-600"
              onClick={fetchRecords}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

     
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Records</h1>
                
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Date:</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]"> <SelectValue /> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
            </Select>
              {dateFilter === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              />
              )}
       </div>
    </div>
    
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
      <Button
      variant={activeFilter === "all" ? "default" : "ghost"}
      size="sm"
      className={activeFilter === "all" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
      onClick={() => setActiveFilter("all")}
      >
        All
      </Button>
      
      <Button
      variant={activeFilter === "in progress" ? "default" : "ghost"}
      size="sm"
      className={activeFilter === "in progress" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
      onClick={() => setActiveFilter("in progress")}
      >
        In Progress
      </Button>
      
      <Button
      variant={activeFilter === "completed" ? "default" : "ghost"}
      size="sm"
      className={activeFilter === "completed" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
      onClick={() => setActiveFilter("completed")}
      >
        Completed
      </Button>
      
      <Button
      variant={activeFilter === "cancelled" ? "default" : "ghost"}
      size="sm"
      className={activeFilter === "cancelled" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
      onClick={() => setActiveFilter("cancelled")}
      >
        Cancelled
      </Button>
    </div>
    </div>

      {/* Only show tabs for clinicians */}
      
    
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Activity ID</TableHead>
            { (isInstructor || isChief) && (
              <TableHead className="font-semibold">Clinician Name</TableHead>
            )}
              <TableHead className="font-semibold">Patient Name</TableHead>
              <TableHead className="font-semibold">Procedure</TableHead>
              <TableHead className="font-semibold">Start Date</TableHead>
              <TableHead className="font-semibold">End Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>            
            </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecords.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.id}</TableCell>
                        {(isInstructor || isChief) && (
                          <TableCell>{activity.clinicianName}</TableCell>
                        )}
                        <TableCell>{activity.patientName}</TableCell>
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
                        <TableCell>{activity.dateStarted}</TableCell>
                        <TableCell>{activity.dateEnded}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              activity.status === "Completed"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : activity.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : activity.status === "Cancelled"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            }
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        {(isClinician || isChief) && (
                        <TableCell>
                          {/* {activity.status === "Completed" &&  ( */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 bg-transparent"
                              onClick={() => {
                                setSelectedActivity(activity)
                                setIsViewModalOpen(true)
                              }}
                            >
                              {/* <FileText className="h-4 w-4" /> */}
                              <Eye/>
                            </Button>
                          {/* )} */}
                        </TableCell>
                        )}
                        {isInstructor && (
                          <TableCell>
                        <div className="flex items-center gap-2">
                          {canEdit && activity.status !== "Cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-blue-600 hover:bg-blue-50 bg-transparent"
                              onClick={() => {
                                setCurrentActivity(activity)
                                setIsGradeModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && activity.status === "In Progress" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleArchiveClick(activity)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && activity.status === "Cancelled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleUnarchiveClick(activity)}
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {filteredActivities.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => setItemsPerPage(Number(value))}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">entries</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 7) return true
                            if (page === 1 || page === totalPages) return true
                            if (Math.abs(page - currentPage) <= 1) return true
                            return false
                          })
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 p-0 ${
                                  currentPage === page ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""
                                }`}
                              >
                                {page}
                              </Button>
                            </div>
                          ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
    
      {/* View Modal (for Clinicians viewing completed activities) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden rounded-lg">
          {selectedActivity && (
            <>
              <DialogHeader className="bg-white px-6 py-5 border-b border-gray-200">
                <DialogTitle className="text-2xl text-[#5C8E77]">
                  {selectedActivity.id}
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 py-5 max-h-[calc(90vh-180px)] overflow-y-auto">
                {/* Activity Header Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Patient Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedActivity.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Patient Type</p>
                    <p className="text-base font-semibold text-gray-900">{selectedActivity.patientType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Date Started</p>
                    <p className="text-base font-semibold text-gray-900">{selectedActivity.dateStarted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Date Ended</p>
                    <p className="text-base font-semibold text-gray-900">{selectedActivity.dateEnded}</p>
                  </div>
                </div>

                {/* Records Timeline */}
                <div className="space-y-4">
                  {selectedActivity.allRecords && selectedActivity.allRecords.length > 0 ? (
                    selectedActivity.allRecords.map((record, recordIndex) => (
                      <div
                        key={recordIndex}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
                      >
                        {/* Date Badge */}
                        <div className="inline-block ml-4 mt-4">
                          <div className="bg-[#5C8E77] text-white px-4 py-1.5 rounded-md font-semibold text-sm">
                            {record.date}
                          </div>
                        </div>

                        {/* Session Details */}
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Instructor</p>
                              <p className="text-base font-semibold text-gray-900">{record.instructorName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Chair</p>
                              <p className="text-base font-semibold text-gray-900">{record.chair}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Time In</p>
                              <p className="text-base font-semibold text-gray-900">{record.timeIn}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Time Out</p>
                              <p className="text-base font-semibold text-gray-900">{record.timeOut}</p>
                            </div>
                          </div>

                          {/* Procedures Table */}
                          <div className="mt-4">
                            <div className="overflow-hidden border border-gray-200 rounded-md">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Procedure
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Status
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {record.procedureStatuses && record.procedureStatuses.length > 0 ? (
                                    record.procedureStatuses.map((procStatus, idx) => (
                                      <tr key={idx}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                          {procStatus.procedure}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge
                                            className={
                                              procStatus.status === "Completed"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : procStatus.status === "In Progress"
                                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                            }
                                          >
                                            {procStatus.status}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                          {procStatus.remarks}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No procedure data available
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No records available for this activity
                    </div>
                  )}
                </div>
              </div>

              {/* <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-100"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter> */}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {canEdit && (
        <>
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

          <UnarchiveConfirmationModal
            isOpen={isUnarchiveModalOpen}
            onClose={() => setIsUnarchiveModalOpen(false)}
            onConfirm={handleUnarchive}
            activity={currentActivity}
          />
        </>
      )}
      
      <Toaster />
    </div>
  )
}