//attendance/clerk
// CSR

"use client"

import { useState, useEffect } from "react"
import { Check, X, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export interface Record {
  id: string
  firstName: string
  lastName: string
  timeIn: string
  timeOut: string
  date: string
  sanitize: string
  status: string
}

export default function ClerkAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<Record | null>(null)
  const [clinicianToTimeout, setClinicianToTimeout] = useState<Record | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState("")

  // Fetch attendance records on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔍 Client session check:')
        console.log('- Session exists:', !!session)
        console.log('- User ID:', session?.user?.id)
        console.log('- Access token exists:', !!session?.access_token)
        console.log('- Session error:', error)
        
        console.log('- Document cookies:', document.cookie)
      } catch (err) {
        console.error('❌ Session check failed:', err)
      }
    }
    
    checkSession()
    fetchAttendanceRecords()
  }, [])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching from client...')
      
      const response = await fetch('/api/requests', {
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

      const response = await fetch('/api/requests', {
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

  // Function to handle delete click
  const handleDeleteClick = (record: Record) => {
    setAttendanceToDelete(record)
    setIsDeleteModalOpen(true)
  }

  // Function to handle timeout click
  const handleTimeoutClick = (record: Record) => {
    setClinicianToTimeout(record)
    setIsTimeoutModalOpen(true)
  }

  // Function to handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!attendanceToDelete) return

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          request_id: attendanceToDelete.id
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

  // Function to handle timeout confirmation
  const handleTimeoutConfirm = async () => {
    if (!clinicianToTimeout) return

    try {
      const response = await fetch('/api/attendance/timeOut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'timeout',
          request_id: clinicianToTimeout.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record timeout')
      }

      const currentTime = new Date()
      const timeOut = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })

      setAttendanceRecords(prev =>
        prev.map(record =>
          record.id === clinicianToTimeout.id 
            ? { ...record, timeOut: timeOut }
            : record
        )
      )

      setIsTimeoutModalOpen(false)
      setClinicianToTimeout(null)

      toast({
        title: "Timeout Recorded",
        description: `${clinicianToTimeout.firstName} ${clinicianToTimeout.lastName} has been timed out at ${timeOut}.`,
      })

    } catch (error) {
      console.error("Failed to record timeout:", error)
      toast({
        title: "Timeout Failed",
        description: "Could not record the timeout.",
        variant: "destructive",
      })
    }
  }

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{status}</Badge>
      case "Pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Format date from record to YYYY-MM-DD for comparison
  const formatDateForComparison = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return dateString
    }
  }

  // Filter records by date
  const filterByDate = (records: Record[]) => {
    if (dateFilter === "all") return records
    
    if (dateFilter === "today") {
      const today = getTodayDate()
      return records.filter(record => formatDateForComparison(record.date) === today)
    }
    
    if (dateFilter === "custom" && customDate) {
      return records.filter(record => formatDateForComparison(record.date) === customDate)
    }
    
    return records
  }

  // Filter attendance records by status and date
  const filteredRecords = filterByDate(attendanceRecords).filter((record) => {
    if (activeFilter === "all") return true
    if (activeFilter === "present") return record.status === "Confirmed"
    return record.status.toLowerCase() === activeFilter.toLowerCase()
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, dateFilter, customDate, itemsPerPage])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading attendance records...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Attendance Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-[#333]">Requests</CardTitle>
              
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
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "pending" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "present" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "present" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("present")}
              >
                Confirmed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Attendance ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Date</TableHead>
                <TableHead className="font-medium text-[#333]">Sanitize</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                    <TableCell className="text-[#333]">{record.firstName}</TableCell>
                    <TableCell className="text-[#333]">{record.lastName}</TableCell>
                    <TableCell className="text-[#333]">{record.date}</TableCell>
                    <TableCell className="text-[#333]">
                      <Select
                        value={record.sanitize.toLowerCase()}
                        onValueChange={(value) => handleSanitizeChange(record.id, value)}
                      >
                        <SelectTrigger
                          className={`w-20 h-7 ${record.sanitize === "Yes" ? "text-[#5C8E77]" : "text-red-500"}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.status === "Pending" ? (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`h-8 w-8 ${
                                        record.sanitize === "Yes"
                                          ? "text-[#5C8E77] hover:bg-[#e6f7eb]"
                                          : "text-gray-400 cursor-not-allowed"
                                      }`}
                                      onClick={() => {
                                        if (record.sanitize === "Yes") {
                                          handleConfirmAttendance(record.id)
                                        }
                                      }}
                                      disabled={record.sanitize === "No"}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {record.sanitize === "No" && (
                                  <TooltipContent>
                                    <p>Sanitization required before marking as present</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(record)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {!record.timeOut && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                        onClick={() => handleTimeoutClick(record)}
                                      >
                                        <Clock className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Record time out for this clinician</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(record)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {filteredRecords.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-[#333]">Are you sure you want to delete this attendance record?</p>
            {attendanceToDelete && (
              <div className="mt-3 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                <p className="font-medium text-[#333]">
                  {attendanceToDelete.firstName} {attendanceToDelete.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {attendanceToDelete.date} • {attendanceToDelete.timeIn} to{" "}
                  {attendanceToDelete.timeOut || "Not timed out"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeout Confirmation Modal */}
      <Dialog open={isTimeoutModalOpen} onOpenChange={setIsTimeoutModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Confirm Time Out</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-[#333]">Are you sure you want to record time out for this clinician?</p>
            {clinicianToTimeout && (
              <div className="mt-3 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                <p className="font-medium text-[#333]">
                  {clinicianToTimeout.firstName} {clinicianToTimeout.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {clinicianToTimeout.date} • Time in: {clinicianToTimeout.timeIn}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsTimeoutModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleTimeoutConfirm}>
              Confirm Time Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}