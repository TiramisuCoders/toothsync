"use client"

import { useEffect, useState } from "react"
import { X, Pencil, ChevronLeft, ChevronRight, ArchiveRestore, FileText, Download, Eye, Search } from "lucide-react"
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
import ViewActModal from "@/components/modals/view-activity-modal"

export interface ProcedureStatus {
  ap_id: string  
  procedure: string
  status: string
  remarks: string
}

export interface RecordInstance {
  id: string  // activity_records.id
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  procedureStatuses: ProcedureStatus[]
}

export interface Activity {
  activity_id: string
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
  const [searchQuery, setSearchQuery] = useState("")  // ADDED: Search state
  
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
      console.log('🔄 Fetching records from API...')
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
        console.log('✅ Records fetched successfully:', records.data.length, 'activities')
        console.log('📋 First activity sample:', records.data[0])
        setActivitiesRecords(records.data)
        setUserRole(records.userRole)
      } else {
        throw new Error(records.error || 'Failed to fetch records')
      }
    } catch (err) {
      console.error('❌ Error fetching records:', err)
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

  const initializeGradingModal = (activity: Activity) => {
    // Get the latest procedure data from most recent record
    const latestProcedureData = activity.allRecords && activity.allRecords.length > 0
      ? activity.procedures?.map((procName: string) => {
          const latestRecord = activity.allRecords[0]
          const procStatus = latestRecord.procedureStatuses?.find(
            (ps: ProcedureStatus) => ps.procedure === procName
          )
          
          return {
            name: procName,
            status: procStatus?.status || "In Progress",
            remarks: procStatus?.remarks || "",
            ap_id: procStatus?.ap_id || ""  // ADDED: Include ap_id
          }
        }) || []
      : activity.procedures?.map((procName: string) => ({
          name: procName,
          status: "In Progress",
          remarks: "",
          ap_id: ""
        })) || []

    setCurrentActivity({
      ...activity,
      procedureDetails: latestProcedureData
    })
    setIsGradeModalOpen(true)
  }

  const handleSaveGrades = async (updatedProcedures?: any[]) => {
    if (!currentActivity) return

    console.log('=== SAVE GRADES START ===')
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

      const updatedProcedures = await Promise.all(procedureUpdates)
      console.log('All procedures updated:', updatedProcedures)

      const allCompleted = updatedProcedures.every(p => p.status === "Completed")
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
      await fetchRecords()
      
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

  // Helper function to highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }

  const filteredActivities = activities.filter((record) => {
    let matchesDate = true
    let matchesStatus = true
    let matchesSearch = true

    // Date filtering
    if (dateFilter === "today") {
      const recordDate = new Date(record.date).toDateString()
      const today = new Date().toDateString()
      matchesDate = recordDate === today
    } else if (dateFilter === "custom" && customDate) {
      matchesDate = record.date === customDate
    }

    // Status filtering
    if (activeFilter === "in progress") {
      matchesStatus = record.status.toLowerCase() === "in progress"
    } else if (activeFilter === "completed") {
      matchesStatus = record.status.toLowerCase() === "completed"
    } else if (activeFilter === "cancelled") {
      matchesStatus = record.status.toLowerCase() === "cancelled"
    }

    // Search filtering (searches across multiple fields)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      matchesSearch = 
        // Search by Activity ID
        record.activity_id?.toLowerCase().includes(query) ||
        // Search by Clinician Name
        record.clinicianName?.toLowerCase().includes(query) ||
        // Search by Patient Name
        record.patientName?.toLowerCase().includes(query) ||
        // Search by Patient Type
        record.patientType?.toLowerCase().includes(query) ||
        // Search by Procedures
        record.procedures?.some((proc: string) => proc.toLowerCase().includes(query)) ||
        // Search by Instructor Name
        record.instructorName?.toLowerCase().includes(query) ||
        // Search by Chair
        record.chair?.toLowerCase().includes(query)
    }

    return matchesDate && matchesStatus && matchesSearch
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Records</h1>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5C8E77] focus:border-transparent w-[250px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
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
    
    {/* Active Filters Summary */}
    {(searchQuery || dateFilter !== "all" || activeFilter !== "all") && (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Active filters:</span>
        
        {searchQuery && (
          <Badge variant="outline" className="gap-1 pr-1">
            Search: {searchQuery}
            <button
              onClick={() => setSearchQuery("")}
              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {dateFilter !== "all" && (
          <Badge variant="outline" className="gap-1 pr-1">
            Date: {dateFilter === "custom" ? customDate : dateFilter}
            <button
              onClick={() => {
                setDateFilter("all")
                setCustomDate("")
              }}
              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {activeFilter !== "all" && (
          <Badge variant="outline" className="gap-1 pr-1">
            Status: {activeFilter}
            <button
              onClick={() => setActiveFilter("all")}
              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery("")
            setActiveFilter("all")
            setDateFilter("all")
            setCustomDate("")
          }}
          className="h-7 text-xs text-gray-600 hover:text-gray-900"
        >
          Clear all
        </Button>
      </div>
    )}
    
    {/* Search Results Info */}
    {searchQuery && (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Search className="h-4 w-4" />
        <span>
          Found <strong>{filteredActivities.length}</strong> result{filteredActivities.length !== 1 ? 's' : ''} for "{searchQuery}"
        </span>
        <button
          onClick={() => setSearchQuery("")}
          className="text-[#5C8E77] hover:underline font-medium"
        >
          Clear search
        </button>
      </div>
    )}
    </div>
    
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Activity ID</TableHead>
            { (isInstructor || isChief) && (
              <TableHead className="font-semibold">Clinician</TableHead>
            )}
              <TableHead className="font-semibold">Patient</TableHead>
              { (isClinician || isChief) && (
              <TableHead className="font-semibold">Instructor</TableHead>
            )}
              <TableHead className="font-semibold">Procedure</TableHead>
              <TableHead className="font-semibold">Start Date</TableHead>
              <TableHead className="font-semibold">End Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>            
            </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecords.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={isInstructor || isChief ? 8 : 7} 
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Search className="h-12 w-12 text-gray-300" />
                            {searchQuery ? (
                              <>
                                <p className="text-lg font-medium">No results found</p>
                                <p className="text-sm">
                                  Try adjusting your search or filters
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSearchQuery("")
                                    setActiveFilter("all")
                                    setDateFilter("all")
                                  }}
                                  className="mt-2"
                                >
                                  Clear all filters
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-medium">No records found</p>
                                <p className="text-sm">
                                  No activities match the current filters
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentRecords.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{highlightText(activity.id, searchQuery)}</TableCell>
                        {(isInstructor || isChief) && (
                          <TableCell>{highlightText(activity.clinicianName || '', searchQuery)}</TableCell>
                        )}
                        <TableCell>{highlightText(activity.patientName || '', searchQuery)}</TableCell>
                        <TableCell>{highlightText(activity.instructorName || '', searchQuery)}</TableCell>
                        <TableCell>
                          {activity.procedures && activity.procedures.length > 0 ? (
                            <div className="space-y-1">
                              {activity.procedures.map((proc, index) => (
                                <div key={index} className="text-sm">
                                  {highlightText(proc, searchQuery)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 bg-transparent"
                              onClick={() => {
                                setSelectedActivity(activity)
                                setIsViewModalOpen(true)
                              }}
                            >
                              <Eye/>
                            </Button>
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
                              onClick={() => initializeGradingModal(activity)}
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
                    ))
                    )}
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
 
      <ViewActModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        currentActivity={selectedActivity}
      />

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