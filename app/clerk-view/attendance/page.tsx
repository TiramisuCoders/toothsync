"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function ClerkAttendance() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")

  // Sample data for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      timeIn: "08:15 AM",
      timeOut: "05:30 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Pending",
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      timeIn: "08:30 AM",
      timeOut: "05:45 PM",
      date: "2025-05-04",
      sanitize: "No",
      status: "Pending",
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      timeIn: "07:55 AM",
      timeOut: "04:30 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      timeIn: "09:10 AM",
      timeOut: "06:00 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Pending",
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      timeIn: "08:00 AM",
      timeOut: "05:00 PM",
      date: "2025-05-04",
      sanitize: "No",
      status: "Pending",
    },
  ])

  // Function to handle confirm attendance
  const handleConfirmAttendance = (id) => {
    setAttendanceRecords(
      attendanceRecords.map((record) => (record.id === id ? { ...record, status: "Present" } : record)),
    )
  }

  // Function to handle delete click
  const handleDeleteClick = (record) => {
    setAttendanceToDelete(record)
    setIsDeleteModalOpen(true)
  }

  // Function to handle delete confirmation
  const handleDeleteConfirm = () => {
    if (attendanceToDelete) {
      setAttendanceRecords(attendanceRecords.filter((record) => record.id !== attendanceToDelete.id))
      setIsDeleteModalOpen(false)
    }
  }

  // Function to get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
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

  // Filter attendance records based on active filter
  const filteredRecords = attendanceRecords.filter((record) => {
    if (activeFilter === "all") return true
    return record.status.toLowerCase() === activeFilter.toLowerCase()
  })

  return (
    <div className="space-y-6">
      {/* Attendance Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">Attendance</CardTitle>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
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
                Present
              </Button>
            </div>
          </div>
          {/* No "New Attendance" button for clerk view as per requirements */}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Attendance ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Time In</TableHead>
                <TableHead className="font-medium text-[#333]">Time Out</TableHead>
                <TableHead className="font-medium text-[#333]">Date</TableHead>
                <TableHead className="font-medium text-[#333]">Sanitize</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                    <TableCell className="text-[#333]">{record.firstName}</TableCell>
                    <TableCell className="text-[#333]">{record.lastName}</TableCell>
                    <TableCell className="text-[#333]">{record.timeIn}</TableCell>
                    <TableCell className="text-[#333]">{record.timeOut}</TableCell>
                    <TableCell className="text-[#333]">{record.date}</TableCell>
                    <TableCell className="text-[#333]">
                      <Select
                        value={record.sanitize.toLowerCase()}
                        onValueChange={(value) => {
                          setAttendanceRecords(
                            attendanceRecords.map((r) =>
                              r.id === record.id
                                ? { ...r, sanitize: value.charAt(0).toUpperCase() + value.slice(1) }
                                : r,
                            ),
                          )
                        }}
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(record)}
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
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                  {attendanceToDelete.date} • {attendanceToDelete.timeIn} to {attendanceToDelete.timeOut}
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
    </div>
  )
}
