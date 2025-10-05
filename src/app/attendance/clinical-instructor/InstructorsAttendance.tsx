"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, X } from "lucide-react"


export interface Record {
  id: string
  clinicianName:string
  timeIn: string
  timeOut: string
  date: string
  sanitize: string
  status: string
  
}

export default function InstructorAttendance() {
  // Filters
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [attendanceRecords, setAttendanceRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
    // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/activities/clinical-instructor', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setAttendanceRecords(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch attendance data')
        }
      } catch (err) {
        console.error('Error fetching attendance:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  // Filter records based on active filter
  // Apply filters
const filteredRecords = attendanceRecords.filter((record) => {
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


  // Function to get status badge color
  const getStatusBadge = (status: string) => {
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

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-500">
            Loading attendance records...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)


 return (
    <div className="space-y-6">
      {/* Attendance Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-[#333]">Attendance</CardTitle>
              
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
                <TableHead className="font-medium text-[#333]">Attendance ID</TableHead>
                <TableHead className="font-medium text-[#333]">Clinician</TableHead>
                <TableHead className="font-medium text-[#333]">Date</TableHead>
                <TableHead className="font-medium text-[#333]">Time In</TableHead>
                <TableHead className="font-medium text-[#333]">Time Out</TableHead>
                {/* <TableHead className="font-medium text-[#333]">Sanitize</TableHead> */}
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                {/* <TableHead className="font-medium text-[#333]">Action</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                    <TableCell className="text-[#333]">{record.clinicianName}</TableCell>
                    <TableCell className="text-[#333]">{record.date}</TableCell>
                    <TableCell className="text-[#333]">{record.timeIn}</TableCell>
                    <TableCell className="text-[#333]">{record.timeOut}</TableCell>
                    {/* <TableCell className="text-[#333]">
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
                    </TableCell> */}
                    {/* <TableCell>{getStatusBadge(record.status)}</TableCell> */}
                    <TableCell>
                      <div
                        className={`px-3 py-1 rounded-full text-sm inline-flex items-center justify-center font-medium ${getStatusBadge(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </div>
                    </TableCell>
                    {/* <TableCell>
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
                    </TableCell> */}
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
  
   
    </div>
  )
}