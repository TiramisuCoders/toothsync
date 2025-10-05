// activities > clinical - instructor

"use client"

import {useEffect, useState } from "react"
import { Edit, Check, X, ChevronUp, ChevronDown, ArrowUpDown, Star, Plus, Pencil, ChevronLeft, ChevronRight, ArchiveRestore } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import ArchiveConfirmationModal from "@/components/modals/archive-record-modal"
import GradingModal from "@/components/modals/grading-modal"
import UnarchiveConfirmationModal from "@/components/modals/unarchive-record-modal"

interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string
  status?: string
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
}

export default function InstructorActivitiesContent() {
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  // const [activityToGrade, setActivityToGrade] = useState<Activity | null>(null)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [gradeValue, setGradeValue] = useState("")
  const [gradeRemarks, setGradeRemarks] = useState("")
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false)
  // const [activityToAction, setActivityToAction] = useState<Activity | null>(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  // const [activeTab, setActiveTab] = useState("details")

  // Filters
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  
  const [activities, setActivitiesRecords] = useState<Activity[]>([])

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const fetchRecords = await fetch('/api/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!fetchRecords.ok) {
          throw new Error(`HTTP error! status: ${fetchRecords.status}`)
        }

        const records = await fetchRecords.json()
        console.log('Fetched records:', records)
        
        if (records.success) {
          console.log('Setting activities:', records.data)
          setActivitiesRecords(records.data)
        } else {
          throw new Error(records.error || 'Failed to fetch records')
        }
      } catch (err) {
        console.error('Error fetching attendance:', err)
      } 
    }
    fetchRecords()
  }, []) 

  
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

      setActivitiesRecords(
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

  const sortedActivities = activities.filter((record) => {
  let matchesDate = true
  let matchesStatus = true

  // Date filter
  if (dateFilter === "today") {
    const recordDate = new Date(record.date).toDateString()
    const today = new Date().toDateString()
    matchesDate = recordDate === today
  } else if (dateFilter === "custom" && customDate) {
    matchesDate = record.date === customDate
  }

  // Status filter
  if (activeFilter === "in progress") {
    matchesStatus = record.status.toLowerCase() === "in progress"
  } else if (activeFilter === "completed") {
    matchesStatus = record.status.toLowerCase() === "completed" || record.status.toLowerCase() === "completed"
  }  else if (activeFilter === "cancelled") {
    matchesStatus = record.status.toLowerCase() === "cancelled" || record.status.toLowerCase() === "cancelled"
  }


  return matchesDate && matchesStatus
})

  // Function to update activity
  const handleUpdateActivity = (updatedActivity: Activity) => {
    if (!updatedActivity) return

    const proceduresToSave = updatedActivity.selectedProcedures || updatedActivity.procedures || []
    const finalUpdatedActivity = {
      ...updatedActivity,
      procedures: proceduresToSave,
    }

    delete finalUpdatedActivity.selectedProcedures

    setActivitiesRecords(
      activities.map((activity) => (activity.id === finalUpdatedActivity.id ? finalUpdatedActivity : activity)),
    )
    setIsEditModalOpen(false)
    toast({
      title: "Activity Updated",
      description: `Activity ${finalUpdatedActivity.id} has been updated successfully.`,
    })
  }

  // Function to handle procedure grade/remarks changes
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

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sort activities
  // const sortedActivities = [...activities].sort((a, b) => {
  //   if (sortField === "id") {
  //     return sortDirection === "asc"
  //       ? Number.parseInt(a.id) - Number.parseInt(b.id)
  //       : Number.parseInt(b.id) - Number.parseInt(a.id)
  //   } else if (sortField === "lastName") {
  //     return sortDirection === "asc" 
  //       ? (a.lastName || "").localeCompare(b.lastName || "") 
  //       : (b.lastName || "").localeCompare(a.lastName || "")
  //   }
  //   return 0
  // })

  // Function to check if activity has any graded procedures
  const hasGradedProcedures = (activity: Activity) => {
    return activity.procedureDetails?.some(p => p.grade && String(p.grade || "").trim() !== "") || false
  }

  // Pagination calculations
  const totalPages = Math.ceil(sortedActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = sortedActivities.slice(startIndex, endIndex)
  

  return (
    <>
      {/* Activities Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-[#333]">Activities</CardTitle>
              
              {/* Instructor Filter */}
              {/* <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Instructor:</span>
                <Select value={instructorFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    <SelectItem value="today">Myself</SelectItem>
                    <SelectItem value="custom">Other Instructors</SelectItem>
                  </SelectContent>
                </Select>
                {instructorFilter === "custom" && (
                  <input
                    type="date"
                    value={Other Instructors}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                )}
              </div> */}

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Date:</span>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
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
            
            
            {/* Status Filter */}
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
                <TableHead className="font-medium text-[#333]">Clinician</TableHead>
                <TableHead className="font-medium text-[#333]">Patient Name</TableHead>
                <TableHead className="font-medium text-[#333]">Chair</TableHead>
                <TableHead className="font-medium text-[#333]">Procedures</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActivities.length > 0 ? (
                sortedActivities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{activity.id}</TableCell>
                    <TableCell className="text-[#333]">{activity.clinicianName}</TableCell>
                    <TableCell className="text-[#333]">{activity.patientName}</TableCell>
                    <TableCell className="text-[#333]">{activity.chair}</TableCell>
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
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    No activities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {sortedActivities.length > 0 && (
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
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedActivities.length)} of {sortedActivities.length}
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
      
     <Toaster />
    </>
  )
}