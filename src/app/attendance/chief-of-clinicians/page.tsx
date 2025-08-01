"use client"

import { useState } from "react"
import { Plus, Check, X, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface AttendanceRecord {
  id: string
  firstName: string
  lastName: string
  timeIn: string
  timeOut: string | null
  date: string
  sanitize: string
  status: string
  activities: Array<{ id: string; status: string }>
  archived?: boolean // Add archived field
}

interface NewAttendanceForm {
  firstName: string
  lastName: string
  timeIn: string
  timeOut: string
  date: string
  sanitize: string
  status: string
}

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false) // Changed from delete to archive
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [attendanceToArchive, setAttendanceToArchive] = useState<AttendanceRecord | null>(null) // Changed from delete to archive
  const [attendanceToTimeout, setAttendanceToTimeout] = useState<AttendanceRecord | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      timeIn: "08:15 AM",
      timeOut: null,
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
      activities: [
        { id: "ACT-001", status: "Completed" },
        { id: "ACT-002", status: "Completed" },
      ],
      archived: false,
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      timeIn: "08:30 AM",
      timeOut: null,
      date: "2025-05-04",
      sanitize: "No",
      status: "Pending",
      activities: [],
      archived: false,
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
      activities: [{ id: "ACT-003", status: "Completed" }],
      archived: false,
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      timeIn: "09:10 AM",
      timeOut: null,
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
      activities: [{ id: "ACT-004", status: "In Progress" }],
      archived: false,
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      timeIn: "08:00 AM",
      timeOut: null,
      date: "2025-05-04",
      sanitize: "No",
      status: "Pending",
      activities: [],
      archived: false,
    },
  ])

  // Success banner state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state for new attendance
  const [newAttendanceForm, setNewAttendanceForm] = useState<NewAttendanceForm>({
    firstName: "",
    lastName: "",
    timeIn: "",
    timeOut: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    sanitize: "",
    status: "pending",
  })

  // Validation state for form fields
  const [fieldErrors, setFieldErrors] = useState({
    firstName: false,
    lastName: false,
    timeIn: false,
    date: false,
    sanitize: false,
  })

  // Function to generate new attendance ID
  const generateAttendanceId = (): string => {
    const maxId = attendanceRecords.reduce((max, record) => {
      const num = Number.parseInt(record.id)
      return num > max ? num : max
    }, 0)
    return String(maxId + 1)
  }

  // Function to format time from 24h to 12h format
  const formatTime = (time24: string): string => {
    if (!time24) return ""
    const [hours, minutes] = time24.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Function to handle form input changes
  const handleFormChange = (field: keyof NewAttendanceForm, value: string): void => {
    setNewAttendanceForm((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: false,
      }))
    }
  }

  // Function to handle form submission
  const handleCreateAttendance = (): void => {
    // Check for validation errors and set field error states
    const errors = {
      firstName: !newAttendanceForm.firstName,
      lastName: !newAttendanceForm.lastName,
      timeIn: !newAttendanceForm.timeIn,
      date: !newAttendanceForm.date,
      sanitize: !newAttendanceForm.sanitize,
    }

    setFieldErrors(errors)
    const hasErrors = Object.values(errors).some((error) => error)

    if (hasErrors) {
      return
    }

    const newRecord: AttendanceRecord = {
      id: generateAttendanceId(),
      firstName: newAttendanceForm.firstName,
      lastName: newAttendanceForm.lastName,
      timeIn: formatTime(newAttendanceForm.timeIn),
      timeOut: newAttendanceForm.timeOut ? formatTime(newAttendanceForm.timeOut) : null,
      date: newAttendanceForm.date,
      sanitize: newAttendanceForm.sanitize.charAt(0).toUpperCase() + newAttendanceForm.sanitize.slice(1),
      status: newAttendanceForm.status.charAt(0).toUpperCase() + newAttendanceForm.status.slice(1),
      activities: [],
      archived: false,
    }

    setAttendanceRecords((prev) => [...prev, newRecord])

    // Add a temporary success highlight to the newly created record
    setTimeout(() => {
      const newRowElement = document.querySelector(`[data-attendance-id="${newRecord.id}"]`)
      if (newRowElement) {
        newRowElement.classList.add("bg-green-50", "border-green-200")
        setTimeout(() => {
          newRowElement.classList.remove("bg-green-50", "border-green-200")
        }, 3000)
      }
    }, 100)

    // Reset form
    setNewAttendanceForm({
      firstName: "",
      lastName: "",
      timeIn: "",
      timeOut: "",
      date: new Date().toISOString().split("T")[0],
      sanitize: "",
      status: "pending",
    })
    setIsModalOpen(false)

    // Show success banner
    setSuccessMessage(`✅ Success! Attendance record created for ${newRecord.firstName} ${newRecord.lastName}`)
    setShowSuccessBanner(true)

    // Hide banner after 5 seconds
    setTimeout(() => {
      setShowSuccessBanner(false)
    }, 5000)

    console.log("New attendance record created:", newRecord)
  }

  const handleConfirmAttendance = (id: string): void => {
    setAttendanceRecords(
      attendanceRecords.map((record) => (record.id === id ? { ...record, status: "Present" } : record)),
    )
  }

  // Changed from handleDeleteClick to handleArchiveClick
  const handleArchiveClick = (record: AttendanceRecord): void => {
    setAttendanceToArchive(record)
    setIsArchiveModalOpen(true)
  }

  const handleTimeoutClick = (record: AttendanceRecord): void => {
    setAttendanceToTimeout(record)
    setIsTimeoutModalOpen(true)
  }

  // Changed from handleDeleteConfirm to handleArchiveConfirm
  const handleArchiveConfirm = (): void => {
    if (attendanceToArchive) {
      setAttendanceRecords(
        attendanceRecords.map((record) =>
          record.id === attendanceToArchive.id ? { ...record, archived: true } : record,
        ),
      )
      setIsArchiveModalOpen(false)
      setAttendanceToArchive(null)
    }
  }

  const handleTimeoutConfirm = (): void => {
    if (attendanceToTimeout) {
      const now = new Date()
      const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      setAttendanceRecords(
        attendanceRecords.map((record) =>
          record.id === attendanceToTimeout.id ? { ...record, timeOut: formattedTime } : record,
        ),
      )
      setIsTimeoutModalOpen(false)
      setAttendanceToTimeout(null)
    }
  }

  const getStatusBadge = (status: string) => {
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

  // Filter out archived records
  const filteredRecords = attendanceRecords.filter((record) => {
    if (record.archived) return false // Hide archived records
    if (activeFilter === "all") return true
    return record.status.toLowerCase() === activeFilter.toLowerCase()
  })

  const canTimeOut = (record: AttendanceRecord): boolean => {
    if (!record.activities || record.activities.length === 0) return true
    return record.activities.every((activity) => activity.status === "Completed" || activity.status === "Cancelled")
  }

  // Update counts to exclude archived records
  const activeRecords = attendanceRecords.filter((record) => !record.archived)

  return (
    <div className="p-6">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-600 text-sm">The new attendance record has been added to the table below.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessBanner(false)}
              className="text-green-600 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
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
                All ({activeRecords.length})
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "pending" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("pending")}
              >
                Pending ({activeRecords.filter((r) => r.status.toLowerCase() === "pending").length})
              </Button>
              <Button
                variant={activeFilter === "present" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "present" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("present")}
              >
                Present ({activeRecords.filter((r) => r.status.toLowerCase() === "present").length})
              </Button>
            </div>
          </div>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> New Attendance
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Time In</TableHead>
                <TableHead className="font-medium text-[#333]">Time Out</TableHead>
                <TableHead className="font-medium text-[#333]">Date</TableHead>
                <TableHead className="font-medium text-[#333]">Sanitize</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-gray-50 border-b border-gray-200"
                    data-attendance-id={record.id}
                  >
                    <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                    <TableCell className="text-[#333]">{record.firstName}</TableCell>
                    <TableCell className="text-[#333]">{record.lastName}</TableCell>
                    <TableCell className="text-[#333]">{record.timeIn}</TableCell>
                    <TableCell className="text-[#333]">
                      {record.timeOut || (
                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                          Not recorded
                        </Badge>
                      )}
                    </TableCell>
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
                              className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleArchiveClick(record)}
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
                                        className={`h-8 w-8 ${
                                          canTimeOut(record)
                                            ? "text-blue-600 hover:bg-blue-50"
                                            : "text-gray-400 cursor-not-allowed"
                                        }`}
                                        onClick={() => {
                                          if (canTimeOut(record)) {
                                            handleTimeoutClick(record)
                                          }
                                        }}
                                        disabled={!canTimeOut(record)}
                                      >
                                        <Clock className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  {!canTimeOut(record) && (
                                    <TooltipContent>
                                      <p>Clinician has activities in progress</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleArchiveClick(record)}
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
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    No attendance records found for the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Attendance Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">New Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#333]">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    className={`border-gray-300 ${
                      fieldErrors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    value={newAttendanceForm.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                  />
                  {fieldErrors.firstName && <p className="text-sm text-red-500">First name is required</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#333]">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    className={`border-gray-300 ${
                      fieldErrors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    value={newAttendanceForm.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                  />
                  {fieldErrors.lastName && <p className="text-sm text-red-500">Last name is required</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeIn" className="text-[#333]">
                    Time In *
                  </Label>
                  <Input
                    id="timeIn"
                    type="time"
                    className={`border-gray-300 ${
                      fieldErrors.timeIn ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    value={newAttendanceForm.timeIn}
                    onChange={(e) => handleFormChange("timeIn", e.target.value)}
                  />
                  {fieldErrors.timeIn && <p className="text-sm text-red-500">Time in is required</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeOut" className="text-[#333]">
                    Time Out <span className="text-gray-500 text-sm">(Optional)</span>
                  </Label>
                  <Input
                    id="timeOut"
                    type="time"
                    className="border-gray-300"
                    value={newAttendanceForm.timeOut}
                    onChange={(e) => handleFormChange("timeOut", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[#333]">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  className={`border-gray-300 ${
                    fieldErrors.date ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  value={newAttendanceForm.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                />
                {fieldErrors.date && <p className="text-sm text-red-500">Date is required</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sanitize" className="text-[#333]">
                  Sanitize *
                </Label>
                <Select
                  value={newAttendanceForm.sanitize}
                  onValueChange={(value) => handleFormChange("sanitize", value)}
                >
                  <SelectTrigger
                    id="sanitize"
                    className={`border-gray-300 ${
                      fieldErrors.sanitize ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.sanitize && <p className="text-sm text-red-500">Sanitize option is required</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#333]">
                  Status
                </Label>
                <Select value={newAttendanceForm.status} onValueChange={(value) => handleFormChange("status", value)}>
                  <SelectTrigger id="status" className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                // Reset form when closing
                setNewAttendanceForm({
                  firstName: "",
                  lastName: "",
                  timeIn: "",
                  timeOut: "",
                  date: new Date().toISOString().split("T")[0],
                  sanitize: "",
                  status: "pending",
                })
                // Reset field errors
                setFieldErrors({
                  firstName: false,
                  lastName: false,
                  timeIn: false,
                  date: false,
                  sanitize: false,
                })
              }}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white" onClick={handleCreateAttendance}>
              Create Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-orange-600">Archive Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-[#333] mb-2">
              Are you sure you want to archive the attendance record for{" "}
              <strong>
                {attendanceToArchive ? `${attendanceToArchive.firstName} ${attendanceToArchive.lastName}` : ""}
              </strong>
              ?
            </p>
            <p className="text-sm text-gray-500">
              Archived records will be hidden from the main view but can be restored later if needed.
            </p>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsArchiveModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleArchiveConfirm}>
              Archive Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Out Confirmation Modal */}
      <Dialog open={isTimeoutModalOpen} onOpenChange={setIsTimeoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Time Out</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to record time out for{" "}
            <strong>
              {attendanceToTimeout ? `${attendanceToTimeout.firstName} ${attendanceToTimeout.lastName}` : ""}
            </strong>
            ?
          </p>
          <p className="text-sm text-gray-500">
            Current time: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeoutModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58]" onClick={handleTimeoutConfirm}>
              Confirm Time Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
