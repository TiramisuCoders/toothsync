"use client"

import { useState } from "react"
import { ArrowUpDown, Check, ChevronDown, ChevronUp, Download, Edit, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ActivitiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activityToAction, setActivityToAction] = useState(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)

  // Sample data for all activities (including past ones)
  const [activities, setActivities] = useState([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      chair: "Chair 05",
      patient: "Juan Dela Cruz",
      instructor: "Dr. Reyes",
      procedure: "Root Canal Treatment", // Keep for backward compatibility
      procedures: ["Root Canal Treatment", "Dental Filling"],
      status: "Started",
      date: "2025-05-08",
      history: [
        {
          timestamp: "2025-05-08T14:20:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Root Canal Treatment",
            patient: "Juan Dela Cruz",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      chair: "Chair 12",
      patient: "Ana Reyes",
      instructor: "Dr. Mendoza",
      procedure: "Dental Filling",
      status: "Not started",
      date: "2025-05-08",
      history: [
        {
          timestamp: "2025-05-08T10:15:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Dental Filling",
            patient: "Ana Reyes",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      chair: "Chair 03",
      patient: "Miguel Santos",
      instructor: "Dr. Santos",
      procedure: "Dental Crown",
      procedures: ["Dental Crown", "Teeth Cleaning"],
      status: "Started",
      date: "2025-05-08",
      history: [
        {
          timestamp: "2025-05-08T09:30:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Dental Crown",
            patient: "Miguel Santos",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      chair: "Chair 08",
      patient: "Sofia Reyes",
      instructor: "Dr. Reyes",
      procedure: "Teeth Cleaning",
      status: "Completed",
      date: "2025-05-08",
      grade: "88",
      remarks: "Thorough cleaning, good patient management",
      history: [
        {
          timestamp: "2025-05-08T16:45:00",
          user: "dr.reyes@example.com",
          action: "Updated",
          description: "Status changed to Completed and grade added",
          details: {
            date: "2025-05-08",
            procedure: "Teeth Cleaning",
            patient: "Sofia Reyes",
            grade: "88",
            remarks: "Thorough cleaning, good patient management",
          },
        },
        {
          timestamp: "2025-05-08T11:20:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Teeth Cleaning",
            patient: "Sofia Reyes",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      chair: "Chair 10",
      patient: "Luis Tan",
      instructor: "Dr. Tan",
      procedure: "Dental Extraction",
      status: "Incomplete",
      date: "2025-05-08",
      history: [
        {
          timestamp: "2025-05-08T17:30:00",
          user: "dr.tan@example.com",
          action: "Updated",
          description: "Status changed to Incomplete",
          details: {
            date: "2025-05-08",
            procedure: "Dental Extraction",
            patient: "Luis Tan",
            grade: "",
            remarks: "Patient had to reschedule due to emergency",
          },
        },
        {
          timestamp: "2025-05-08T13:10:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Dental Extraction",
            patient: "Luis Tan",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    // Past activities
    {
      id: "6",
      firstName: "Carlos",
      lastName: "Mendoza",
      chair: "Chair 07",
      patient: "Elena Cruz",
      instructor: "Dr. Santos",
      procedure: "Dental Filling",
      status: "Completed",
      date: "2025-05-07",
      grade: "92",
      remarks: "Excellent work on composite layering",
      history: [
        {
          timestamp: "2025-05-07T16:20:00",
          user: "dr.santos@example.com",
          action: "Updated",
          description: "Status changed to Completed and grade added",
          details: {
            date: "2025-05-07",
            procedure: "Dental Filling",
            patient: "Elena Cruz",
            grade: "92",
            remarks: "Excellent work on composite layering",
          },
        },
        {
          timestamp: "2025-05-07T10:30:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-07",
            procedure: "Dental Filling",
            patient: "Elena Cruz",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "7",
      firstName: "Sophia",
      lastName: "Reyes",
      chair: "Chair 15",
      patient: "Marco Tan",
      instructor: "Dr. Mendoza",
      procedure: "Teeth Cleaning",
      status: "Completed",
      date: "2025-05-07",
      grade: "85",
      remarks: "Good technique, needs to improve on posterior areas",
      history: [
        {
          timestamp: "2025-05-07T15:45:00",
          user: "dr.mendoza@example.com",
          action: "Updated",
          description: "Status changed to Completed and grade added",
          details: {
            date: "2025-05-07",
            procedure: "Teeth Cleaning",
            patient: "Marco Tan",
            grade: "85",
            remarks: "Good technique, needs to improve on posterior areas",
          },
        },
        {
          timestamp: "2025-05-07T09:15:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-07",
            procedure: "Teeth Cleaning",
            patient: "Marco Tan",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "8",
      firstName: "Miguel",
      lastName: "Santos",
      chair: "Chair 09",
      patient: "Lucia Garcia",
      instructor: "Dr. Reyes",
      procedure: "Root Canal Treatment",
      procedures: ["Root Canal Treatment", "Dental Extraction"],
      status: "Incomplete",
      date: "2025-05-06",
      remarks: "Patient needed to reschedule due to time constraints",
      history: [
        {
          timestamp: "2025-05-06T16:30:00",
          user: "dr.reyes@example.com",
          action: "Updated",
          description: "Status changed to Incomplete",
          details: {
            date: "2025-05-06",
            procedure: "Root Canal Treatment",
            patient: "Lucia Garcia",
            grade: "",
            remarks: "Patient needed to reschedule due to time constraints",
          },
        },
        {
          timestamp: "2025-05-06T10:45:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-06",
            procedure: "Root Canal Treatment",
            patient: "Lucia Garcia",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "9",
      firstName: "Isabella",
      lastName: "Cruz",
      chair: "Chair 11",
      patient: "Gabriel Lim",
      instructor: "Dr. Tan",
      procedure: "Dental Crown",
      status: "Completed",
      date: "2025-05-06",
      grade: "90",
      remarks: "Excellent margin preparation and temporization",
      history: [
        {
          timestamp: "2025-05-06T17:15:00",
          user: "dr.tan@example.com",
          action: "Updated",
          description: "Status changed to Completed and grade added",
          details: {
            date: "2025-05-06",
            procedure: "Dental Crown",
            patient: "Gabriel Lim",
            grade: "90",
            remarks: "Excellent margin preparation and temporization",
          },
        },
        {
          timestamp: "2025-05-06T11:30:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-06",
            procedure: "Dental Crown",
            patient: "Gabriel Lim",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
    {
      id: "10",
      firstName: "Gabriel",
      lastName: "Tan",
      chair: "Chair 04",
      patient: "Sofia Mendoza",
      instructor: "Dr. Santos",
      procedure: "Dental Extraction",
      status: "Completed",
      date: "2025-05-05",
      grade: "88",
      remarks: "Good technique and patient management",
      history: [
        {
          timestamp: "2025-05-05T16:00:00",
          user: "dr.santos@example.com",
          action: "Updated",
          description: "Status changed to Completed and grade added",
          details: {
            date: "2025-05-05",
            procedure: "Dental Extraction",
            patient: "Sofia Mendoza",
            grade: "88",
            remarks: "Good technique and patient management",
          },
        },
        {
          timestamp: "2025-05-05T10:15:00",
          user: "admin@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-05",
            procedure: "Dental Extraction",
            patient: "Sofia Mendoza",
            grade: "",
            remarks: "",
          },
        },
      ],
    },
  ])

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Started":
        return "bg-[#5C8E77]/10 text-[#5C8E77]"
      case "Completed":
        return "bg-blue-50 text-blue-700"
      case "Not started":
        return "bg-yellow-50 text-yellow-700"
      case "Incomplete":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  // Function to handle edit button click
  const handleEdit = (activity) => {
    setCurrentActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleCompleteClick = (activity) => {
    setActivityToAction(activity)
    setIsCompleteModalOpen(true)
  }

  const handleComplete = () => {
    if (activityToAction) {
      // Create a new history entry
      const newHistory = {
        timestamp: new Date().toISOString(),
        user: "admin@example.com",
        action: "Updated",
        description: "Status changed to Completed",
        details: {
          date: activityToAction.date,
          procedure: activityToAction.procedure,
          patient: activityToAction.patient,
          grade: activityToAction.grade || "",
          remarks: activityToAction.remarks || "",
        },
      }

      setActivities(
        activities.map((activity) =>
          activity.id === activityToAction.id
            ? {
                ...activity,
                status: "Completed",
                history: [newHistory, ...activity.history],
              }
            : activity,
        ),
      )
      setIsCompleteModalOpen(false)
    }
  }

  const handleArchiveClick = (activity) => {
    setActivityToAction(activity)
    setIsArchiveModalOpen(true)
  }

  const handleArchive = () => {
    if (activityToAction) {
      // Create a new history entry
      const newHistory = {
        timestamp: new Date().toISOString(),
        user: "admin@example.com",
        action: "Updated",
        description: "Status changed to Incomplete",
        details: {
          date: activityToAction.date,
          procedure: activityToAction.procedure,
          patient: activityToAction.patient,
          grade: activityToAction.grade || "",
          remarks: activityToAction.remarks || "",
        },
      }

      setActivities(
        activities.map((activity) =>
          activity.id === activityToAction.id
            ? {
                ...activity,
                status: "Incomplete",
                history: [newHistory, ...activity.history],
              }
            : activity,
        ),
      )
      setIsArchiveModalOpen(false)
    }
  }

  // Function to update activity
  const handleUpdateActivity = (updatedActivity) => {
    // Create a new history entry
    const newHistory = {
      timestamp: new Date().toISOString(),
      user: "admin@example.com",
      action: "Updated",
      description: "Activity details updated",
      details: {
        date: updatedActivity.date,
        procedure: updatedActivity.procedure,
        patient: updatedActivity.patient,
        grade: updatedActivity.grade || "",
        remarks: updatedActivity.remarks || "",
      },
    }

    setActivities(
      activities.map((activity) =>
        activity.id === updatedActivity.id
          ? {
              ...updatedActivity,
              history: [newHistory, ...activity.history],
            }
          : activity,
      ),
    )
    setIsEditModalOpen(false)
  }

  // Function to handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Function to export activities to CSV
  const exportActivitiesToCSV = () => {
    // Create CSV header
    const headers = [
      "ID",
      "Date",
      "First Name",
      "Last Name",
      "Patient",
      "Chair",
      "Instructor",
      "Procedure",
      "Status",
      "Grade",
      "Remarks",
    ].join(",")

    // Create CSV rows
    const rows = activities.map(
      (activity) =>
        `"${activity.id}","${activity.date}","${activity.firstName}","${activity.lastName}","${activity.patient}","${
          activity.chair
        }","${activity.instructor}","${activity.procedure}","${activity.status}","${activity.grade || ""}","${
          activity.remarks || ""
        }"`,
    )

    // Combine header and rows
    const csv = [headers, ...rows].join("\n")

    // Create a blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Activities_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Sort activities
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortField === "id") {
      return sortDirection === "asc"
        ? Number.parseInt(a.id) - Number.parseInt(b.id)
        : Number.parseInt(b.id) - Number.parseInt(a.id)
    } else if (sortField === "lastName") {
      return sortDirection === "asc" ? a.lastName.localeCompare(b.lastName) : b.lastName.localeCompare(a.lastName)
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      {/* Activities Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <CardTitle className="text-xl font-semibold text-[#333]">All Activities</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-[#5C8E77] text-[#5C8E77] bg-transparent"
              onClick={exportActivitiesToCSV}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> New Activity
            </Button>
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
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333] cursor-pointer" onClick={() => handleSort("lastName")}>
                  <div className="flex items-center">
                    Last Name
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                    {sortField === "lastName" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="font-medium text-[#333]">Patient</TableHead>
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
                    <TableCell className="text-[#333]">{activity.firstName}</TableCell>
                    <TableCell className="text-[#333]">{activity.lastName}</TableCell>
                    <TableCell className="text-[#333]">{activity.patient}</TableCell>
                    <TableCell className="text-[#333]">{activity.chair}</TableCell>
                    <TableCell className="text-[#333]">{activity.instructor}</TableCell>
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
                        activity.procedure
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
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleCompleteClick(activity)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleArchiveClick(activity)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
        </CardContent>
      </Card>

      {/* New Activity Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">New Activity</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#333]">
                    First Name
                  </Label>
                  <Input id="firstName" placeholder="Enter first name" className="border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#333]">
                    Last Name
                  </Label>
                  <Input id="lastName" placeholder="Enter last name" className="border-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chair" className="text-[#333]">
                    Chair
                  </Label>
                  <Select>
                    <SelectTrigger id="chair" className="border-gray-300">
                      <SelectValue placeholder="Select chair" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chair03">Chair 03</SelectItem>
                      <SelectItem value="chair05">Chair 05</SelectItem>
                      <SelectItem value="chair08">Chair 08</SelectItem>
                      <SelectItem value="chair10">Chair 10</SelectItem>
                      <SelectItem value="chair12">Chair 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor" className="text-[#333]">
                    Instructor
                  </Label>
                  <Select>
                    <SelectTrigger id="instructor" className="border-gray-300">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reyes">Dr. Reyes</SelectItem>
                      <SelectItem value="mendoza">Dr. Mendoza</SelectItem>
                      <SelectItem value="santos">Dr. Santos</SelectItem>
                      <SelectItem value="tan">Dr. Tan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient" className="text-[#333]">
                  Patient
                </Label>
                <Input id="patient" placeholder="Enter patient name" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedure" className="text-[#333]">
                  Procedures (Select up to 2)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="root-canal"
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label htmlFor="root-canal" className="text-sm text-gray-700">
                      Root Canal Treatment
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="filling"
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label htmlFor="filling" className="text-sm text-gray-700">
                      Dental Filling
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="crown"
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label htmlFor="crown" className="text-sm text-gray-700">
                      Dental Crown
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cleaning"
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label htmlFor="cleaning" className="text-sm text-gray-700">
                      Teeth Cleaning
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="extraction"
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label htmlFor="extraction" className="text-sm text-gray-700">
                      Dental Extraction
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">You can select up to 2 procedures per activity.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-[#333]">
                  Status
                </Label>
                <Select defaultValue="not-started">
                  <SelectTrigger id="status" className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not started</SelectItem>
                    <SelectItem value="started">Started</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white">Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {currentActivity && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Activity</DialogTitle>
              </DialogHeader>
              <div className="px-6 py-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details">Activity Details</TabsTrigger>
                    <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName" className="text-[#333]">
                            First Name
                          </Label>
                          <Input
                            id="edit-firstName"
                            defaultValue={currentActivity.firstName}
                            onChange={(e) => setCurrentActivity({ ...currentActivity, firstName: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName" className="text-[#333]">
                            Last Name
                          </Label>
                          <Input
                            id="edit-lastName"
                            defaultValue={currentActivity.lastName}
                            onChange={(e) => setCurrentActivity({ ...currentActivity, lastName: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-chair" className="text-[#333]">
                            Chair
                          </Label>
                          <Select defaultValue={currentActivity.chair}>
                            <SelectTrigger id="edit-chair" className="border-gray-300">
                              <SelectValue placeholder={currentActivity.chair} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Chair 03">Chair 03</SelectItem>
                              <SelectItem value="Chair 05">Chair 05</SelectItem>
                              <SelectItem value="Chair 08">Chair 08</SelectItem>
                              <SelectItem value="Chair 10">Chair 10</SelectItem>
                              <SelectItem value="Chair 12">Chair 12</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-instructor" className="text-[#333]">
                            Instructor
                          </Label>
                          <Select defaultValue={currentActivity.instructor}>
                            <SelectTrigger id="edit-instructor" className="border-gray-300">
                              <SelectValue placeholder={currentActivity.instructor} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dr. Reyes">Dr. Reyes</SelectItem>
                              <SelectItem value="Dr. Mendoza">Dr. Mendoza</SelectItem>
                              <SelectItem value="Dr. Santos">Dr. Santos</SelectItem>
                              <SelectItem value="Dr. Tan">Dr. Tan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-patient" className="text-[#333]">
                          Patient
                        </Label>
                        <Input
                          id="edit-patient"
                          defaultValue={currentActivity.patient}
                          onChange={(e) => setCurrentActivity({ ...currentActivity, patient: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-procedure" className="text-[#333]">
                          Procedures (Select up to 2)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-root-canal"
                              className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                              defaultChecked={
                                currentActivity.procedures?.includes("Root Canal Treatment") ||
                                currentActivity.procedure === "Root Canal Treatment"
                              }
                            />
                            <label htmlFor="edit-root-canal" className="text-sm text-gray-700">
                              Root Canal Treatment
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-filling"
                              className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                              defaultChecked={
                                currentActivity.procedures?.includes("Dental Filling") ||
                                currentActivity.procedure === "Dental Filling"
                              }
                            />
                            <label htmlFor="edit-filling" className="text-sm text-gray-700">
                              Dental Filling
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-crown"
                              className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                              defaultChecked={
                                currentActivity.procedures?.includes("Dental Crown") ||
                                currentActivity.procedure === "Dental Crown"
                              }
                            />
                            <label htmlFor="edit-crown" className="text-sm text-gray-700">
                              Dental Crown
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-cleaning"
                              className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                              defaultChecked={
                                currentActivity.procedures?.includes("Teeth Cleaning") ||
                                currentActivity.procedure === "Teeth Cleaning"
                              }
                            />
                            <label htmlFor="edit-cleaning" className="text-sm text-gray-700">
                              Teeth Cleaning
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-extraction"
                              className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                              defaultChecked={
                                currentActivity.procedures?.includes("Dental Extraction") ||
                                currentActivity.procedure === "Dental Extraction"
                              }
                            />
                            <label htmlFor="edit-extraction" className="text-sm text-gray-700">
                              Dental Extraction
                            </label>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">You can select up to 2 procedures per activity.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-[#333]">
                          Status
                        </Label>
                        <Select
                          defaultValue={currentActivity.status}
                          onValueChange={(value) => setCurrentActivity({ ...currentActivity, status: value })}
                        >
                          <SelectTrigger id="edit-status" className="border-gray-300">
                            <SelectValue placeholder={currentActivity.status} />
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
                  </TabsContent>
                  <TabsContent value="assessment" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="activity-id" className="text-[#333]">
                            Activity ID
                          </Label>
                          <Input
                            id="activity-id"
                            value={currentActivity.id}
                            readOnly
                            className="border-gray-300 bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assessment-procedure" className="text-[#333]">
                            Procedure
                          </Label>
                          <Input
                            id="assessment-procedure"
                            value={currentActivity.procedure}
                            readOnly
                            className="border-gray-300 bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assessment-patient" className="text-[#333]">
                          Patient
                        </Label>
                        <Input
                          id="assessment-patient"
                          value={currentActivity.patient}
                          readOnly
                          className="border-gray-300 bg-gray-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="grade" className="text-[#333]">
                            Grade
                          </Label>
                          <Input
                            id="grade"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter grade (0-100)"
                            className="border-gray-300"
                            onChange={(e) => setCurrentActivity({ ...currentActivity, grade: e.target.value })}
                            defaultValue={currentActivity.grade || ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assessment-status" className="text-[#333]">
                            Assessment Status
                          </Label>
                          <Select defaultValue={currentActivity.assessmentStatus || "in-progress"}>
                            <SelectTrigger id="assessment-status" className="border-gray-300">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="graded">Graded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarks" className="text-[#333]">
                          Remarks
                        </Label>
                        <textarea
                          id="remarks"
                          rows={4}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Enter instructor feedback or clinical observations"
                          defaultValue={currentActivity.remarks || ""}
                          onChange={(e) => setCurrentActivity({ ...currentActivity, remarks: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                  onClick={() => handleUpdateActivity(currentActivity)}
                >
                  Update Activity
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Confirm Action</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-[#333]">Are you sure you want to mark this activity as completed?</p>
            {activityToAction && (
              <div className="mt-3 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                <p className="font-medium text-[#333]">{activityToAction.procedure}</p>
                <p className="text-sm text-[#5C8E77]">
                  {activityToAction.firstName} {activityToAction.lastName} • {activityToAction.chair}
                </p>
                <p className="text-sm text-gray-500 mt-1">Patient: {activityToAction.patient}</p>
              </div>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleComplete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Confirm Action</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-[#333]">Are you sure you want to mark this activity as incomplete?</p>
            {activityToAction && (
              <div className="mt-3 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                <p className="font-medium text-[#333]">{activityToAction.procedure}</p>
                <p className="text-sm text-[#5C8E77]">
                  {activityToAction.firstName} {activityToAction.lastName} • {activityToAction.chair}
                </p>
                <p className="text-sm text-gray-500 mt-1">Patient: {activityToAction.patient}</p>
              </div>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsArchiveModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleArchive}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
