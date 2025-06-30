"use client"

import { useState } from "react"
import { Calendar, Plus, Edit, Upload, User, Eye, Download, History, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function CliniciansPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentClinician, setCurrentClinician] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedClinician, setSelectedClinician] = useState(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [activeTab, setActiveTab] = useState("activities")
  const [isActivityEditModalOpen, setIsActivityEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)

  // Sample data for clinicians
  const [clinicians, setClinicians] = useState([
    {
      id: "C2024-001",
      firstName: "Maria",
      lastName: "Santos",
      gender: "Female",
      status: "Enrolled",
      birthday: "1998-05-15",
      email: "maria.santos@example.com",
      contactNumber: "+63 912 345 6789",
      address: "123 Rizal Avenue, Manila",
      yearLevel: "5th Year",
      section: "A",
    },
    {
      id: "C2024-002",
      firstName: "John",
      lastName: "Dela Cruz",
      gender: "Male",
      status: "Enrolled",
      birthday: "1997-08-22",
      email: "john.delacruz@example.com",
      contactNumber: "+63 917 123 4567",
      address: "456 Mabini Street, Quezon City",
      yearLevel: "6th Year",
      section: "B",
    },
    {
      id: "C2024-003",
      firstName: "Anna",
      lastName: "Lim",
      gender: "Female",
      status: "Not Enrolled",
      birthday: "1999-02-10",
      email: "anna.lim@example.com",
      contactNumber: "+63 918 765 4321",
      address: "789 Bonifacio Avenue, Makati",
      yearLevel: "5th Year",
      section: "A",
    },
    {
      id: "C2024-004",
      firstName: "Mark",
      lastName: "Aquino",
      gender: "Male",
      status: "Enrolled",
      birthday: "1996-11-30",
      email: "mark.aquino@example.com",
      contactNumber: "+63 919 876 5432",
      address: "321 Aguinaldo Street, Pasig",
      yearLevel: "6th Year",
      section: "C",
    },
    {
      id: "C2024-005",
      firstName: "Sarah",
      lastName: "Garcia",
      gender: "Female",
      status: "Not Enrolled",
      birthday: "1998-07-18",
      email: "sarah.garcia@example.com",
      contactNumber: "+63 915 432 1098",
      address: "654 Luna Road, Mandaluyong",
      yearLevel: "5th Year",
      section: "B",
    },
  ])

  // Add sample attendance data
  const [attendanceData] = useState([
    {
      id: 1,
      date: "2025-05-08",
      timeIn: "08:15 AM",
      timeOut: "04:30 PM",
      sanitized: "Yes",
      status: "Present",
    },
    {
      id: 2,
      date: "2025-05-07",
      timeIn: "08:05 AM",
      timeOut: "04:45 PM",
      sanitized: "Yes",
      status: "Present",
    },
    {
      id: 3,
      date: "2025-05-06",
      timeIn: "08:30 AM",
      timeOut: "04:15 PM",
      sanitized: "Yes",
      status: "Present",
    },
    {
      id: 4,
      date: "2025-05-05",
      timeIn: "09:00 AM",
      timeOut: "04:00 PM",
      sanitized: "Yes",
      status: "Present",
    },
    {
      id: 5,
      date: "2025-05-02",
      timeIn: "08:10 AM",
      timeOut: "04:20 PM",
      sanitized: "Yes",
      status: "Present",
    },
  ])

  // Add sample activities data
  const [activitiesData, setActivitiesData] = useState([
    {
      id: "A001",
      date: "2025-05-08",
      procedure: "Root Canal Treatment",
      chair: "Chair 05",
      instructor: "Dr. Reyes",
      patient: "Juan Dela Cruz",
      grade: "85",
      remarks: "Good work on canal preparation",
      status: "Completed",
      firstName: "Maria",
      lastName: "Santos",
      history: [
        {
          timestamp: "2025-05-08T15:30:00",
          user: "dr.reyes@example.com",
          action: "Updated",
          description: "Grade changed from 80 to 85",
          details: {
            date: "2025-05-08",
            procedure: "Root Canal Treatment",
            patient: "Juan Dela Cruz",
            grade: "85",
            remarks: "Good work on canal preparation",
          },
        },
        {
          timestamp: "2025-05-08T14:20:00",
          user: "dr.reyes@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-08",
            procedure: "Root Canal Treatment",
            patient: "Juan Dela Cruz",
            grade: "80",
            remarks: "Needs improvement on final cleaning",
          },
        },
      ],
    },
    {
      id: "A002",
      date: "2025-05-07",
      procedure: "Dental Filling",
      chair: "Chair 12",
      instructor: "Dr. Mendoza",
      patient: "Ana Reyes",
      grade: "90",
      remarks: "Excellent composite placement",
      status: "Completed",
      firstName: "John",
      lastName: "Dela Cruz",
      history: [
        {
          timestamp: "2025-05-07T16:45:00",
          user: "dr.mendoza@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-07",
            procedure: "Dental Filling",
            patient: "Ana Reyes",
            grade: "90",
            remarks: "Excellent composite placement",
          },
        },
      ],
    },
    {
      id: "A003",
      date: "2025-05-06",
      procedure: "Dental Crown",
      chair: "Chair 03",
      instructor: "Dr. Santos",
      patient: "Miguel Santos",
      grade: "82",
      remarks: "Needs improvement on margin preparation",
      status: "Completed",
      firstName: "Anna",
      lastName: "Lim",
      history: [
        {
          timestamp: "2025-05-06T15:10:00",
          user: "dr.santos@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-06",
            procedure: "Dental Crown",
            patient: "Miguel Santos",
            grade: "82",
            remarks: "Needs improvement on margin preparation",
          },
        },
      ],
    },
    {
      id: "A004",
      date: "2025-05-05",
      procedure: "Teeth Cleaning",
      chair: "Chair 08",
      instructor: "Dr. Reyes",
      patient: "Sofia Reyes",
      grade: "88",
      remarks: "Thorough cleaning, good patient management",
      status: "Completed",
      firstName: "Mark",
      lastName: "Aquino",
      history: [
        {
          timestamp: "2025-05-05T14:30:00",
          user: "dr.reyes@example.com",
          action: "Updated",
          description: "Remarks updated",
          details: {
            date: "2025-05-05",
            procedure: "Teeth Cleaning",
            patient: "Sofia Reyes",
            grade: "88",
            remarks: "Thorough cleaning, good patient management",
          },
        },
        {
          timestamp: "2025-05-05T11:20:00",
          user: "dr.reyes@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-05",
            procedure: "Teeth Cleaning",
            patient: "Sofia Reyes",
            grade: "88",
            remarks: "Good cleaning technique",
          },
        },
      ],
    },
    {
      id: "A005",
      date: "2025-05-02",
      procedure: "Dental Extraction",
      chair: "Chair 10",
      instructor: "Dr. Tan",
      patient: "Luis Tan",
      grade: "78",
      remarks: "Needs to improve extraction technique",
      status: "Completed",
      firstName: "Sarah",
      lastName: "Garcia",
      history: [
        {
          timestamp: "2025-05-02T16:15:00",
          user: "dr.tan@example.com",
          action: "Created",
          description: "Initial activity record created",
          details: {
            date: "2025-05-02",
            procedure: "Dental Extraction",
            patient: "Luis Tan",
            grade: "78",
            remarks: "Needs to improve extraction technique",
          },
        },
      ],
    },
  ])

  // Function to handle edit button click
  const handleEditClick = (clinician) => {
    setCurrentClinician(clinician)
    setIsEditModalOpen(true)
  }

  // Function to handle view button click
  const handleViewClick = (clinician) => {
    setSelectedClinician(clinician)
    setIsViewModalOpen(true)
  }

  // Function to handle history button click
  const handleHistoryClick = (activity) => {
    setSelectedActivity(activity)
    setIsHistoryModalOpen(true)
  }

  // Function to handle activity edit button click
  const handleActivityEditClick = (activity) => {
    setCurrentActivity(activity)
    setIsActivityEditModalOpen(true)
  }

  // Function to update clinician
  const handleUpdateClinician = (updatedClinician) => {
    setClinicians(clinicians.map((clinician) => (clinician.id === updatedClinician.id ? updatedClinician : clinician)))
    setIsEditModalOpen(false)
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

    setActivitiesData(
      activitiesData.map((activity) =>
        activity.id === updatedActivity.id
          ? {
              ...updatedActivity,
              history: [newHistory, ...activity.history],
            }
          : activity,
      ),
    )
    setIsActivityEditModalOpen(false)
  }

  // Function to add new clinician
  const handleAddClinician = (newClinician) => {
    setClinicians([...clinicians, { ...newClinician, id: `C2024-00${clinicians.length + 1}` }])
    setIsAddModalOpen(false)
  }

  // Function to export activities to CSV
  const exportActivitiesToCSV = () => {
    if (!selectedClinician) return

    // Create CSV header
    const headers = ["ID", "Date", "Procedure", "Patient", "Chair", "Instructor", "Grade", "Status", "Remarks"].join(
      ",",
    )

    // Create CSV rows
    const rows = activitiesData.map(
      (activity) =>
        `"${activity.id}","${activity.date}","${activity.procedure}","${activity.patient}","${activity.chair}","${activity.instructor}","${activity.grade}","${activity.status}","${activity.remarks}"`,
    )

    // Combine header and rows
    const csv = [headers, ...rows].join("\n")

    // Create a blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${selectedClinician.firstName}_${selectedClinician.lastName}_Activities_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to export attendance to CSV
  const exportAttendanceToCSV = () => {
    if (!selectedClinician) return

    // Create CSV header
    const headers = ["Date", "Time In", "Time Out", "Sanitized", "Status"].join(",")

    // Create CSV rows
    const rows = attendanceData.map(
      (attendance) =>
        `"${attendance.date}","${attendance.timeIn}","${attendance.timeOut}","${attendance.sanitized}","${attendance.status}"`,
    )

    // Combine header and rows
    const csv = [headers, ...rows].join("\n")

    // Create a blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${selectedClinician.firstName}_${selectedClinician.lastName}_Attendance_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to export current tab data to CSV
  const exportToCSV = () => {
    if (activeTab === "activities") {
      exportActivitiesToCSV()
    } else {
      exportAttendanceToCSV()
    }
  }

  // Filter clinicians based on active filter
  const filteredClinicians = clinicians.filter((clinician) => {
    if (activeFilter === "all") return true
    if (activeFilter === "enrolled") return clinician.status === "Enrolled"
    if (activeFilter === "not-enrolled") return clinician.status === "Not Enrolled"
    return true
  })

  return (
    <DashboardLayout>
      {/* Academic Term - Static */}
      <div className="mb-6">
        <div className="bg-[#5C8E77]/10 border border-[#5C8E77]/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#333]">Academic Year</h2>
              <span className="font-medium text-[#333]">AY 2024-2025, 1st Semester</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Viewing clinicians for the current academic year and semester</p>
          </div>
          <Badge className="bg-[#5C8E77]">Active</Badge>
        </div>
      </div>

      {/* Clinicians Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">List of Clinicians</CardTitle>
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
                variant={activeFilter === "enrolled" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "enrolled" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("enrolled")}
              >
                Enrolled
              </Button>
              <Button
                variant={activeFilter === "not-enrolled" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "not-enrolled" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("not-enrolled")}
              >
                Not Enrolled
              </Button>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Clinician
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddModalOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Add Manually</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Clinician ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Year</TableHead>
                <TableHead className="font-medium text-[#333]">Section</TableHead>
                <TableHead className="font-medium text-[#333]">Gender</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinicians.length > 0 ? (
                filteredClinicians.map((clinician) => (
                  <TableRow key={clinician.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{clinician.id}</TableCell>
                    <TableCell className="text-[#333]">{clinician.firstName}</TableCell>
                    <TableCell className="text-[#333]">{clinician.lastName}</TableCell>
                    <TableCell className="text-[#333]">{clinician.yearLevel}</TableCell>
                    <TableCell className="text-[#333]">{clinician.section}</TableCell>
                    <TableCell className="text-[#333]">{clinician.gender}</TableCell>
                    <TableCell>
                      {clinician.status === "Enrolled" ? (
                        <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{clinician.status}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          {clinician.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                          onClick={() => handleEditClick(clinician)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewClick(clinician)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    No clinicians found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Clinician Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Add New Clinician</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the clinician details to add them to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="academic">Academic Information</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4">
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
                    <Label htmlFor="gender" className="text-[#333]">
                      Gender
                    </Label>
                    <Select>
                      <SelectTrigger id="gender" className="border-gray-300">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-[#333]">
                      Birthday
                    </Label>
                    <Input id="birthday" type="date" className="border-gray-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333]">
                    Email
                  </Label>
                  <Input id="email" type="email" placeholder="Enter email address" className="border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-[#333]">
                    Contact Number
                  </Label>
                  <Input id="contactNumber" placeholder="Enter contact number" className="border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#333]">
                    Address
                  </Label>
                  <Input id="address" placeholder="Enter address" className="border-gray-300" />
                </div>
              </TabsContent>
              <TabsContent value="academic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yearLevel" className="text-[#333]">
                    Year Level
                  </Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="5">5th Year</SelectItem>
                      <SelectItem value="6">6th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section" className="text-[#333]">
                    Section
                  </Label>
                  <Select>
                    <SelectTrigger id="section" className="border-gray-300">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                      <SelectItem value="D">Section D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[#333]">
                    Enrollment Status
                  </Label>
                  <Select>
                    <SelectTrigger id="status" className="border-gray-300">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white">Add Clinician</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Clinician Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {currentClinician && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Clinician</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Update clinician information for {currentClinician.firstName} {currentClinician.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="academic">Academic Information</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName" className="text-[#333]">
                          First Name
                        </Label>
                        <Input
                          id="edit-firstName"
                          defaultValue={currentClinician.firstName}
                          onChange={(e) => setCurrentClinician({ ...currentClinician, firstName: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName" className="text-[#333]">
                          Last Name
                        </Label>
                        <Input
                          id="edit-lastName"
                          defaultValue={currentClinician.lastName}
                          onChange={(e) => setCurrentClinician({ ...currentClinician, lastName: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-gender" className="text-[#333]">
                          Gender
                        </Label>
                        <Select
                          defaultValue={currentClinician.gender.toLowerCase()}
                          onValueChange={(value) =>
                            setCurrentClinician({
                              ...currentClinician,
                              gender: value.charAt(0).toUpperCase() + value.slice(1),
                            })
                          }
                        >
                          <SelectTrigger id="edit-gender" className="border-gray-300">
                            <SelectValue placeholder={currentClinician.gender} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-birthday" className="text-[#333]">
                          Birthday
                        </Label>
                        <Input
                          id="edit-birthday"
                          type="date"
                          defaultValue={currentClinician.birthday}
                          onChange={(e) => setCurrentClinician({ ...currentClinician, birthday: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-[#333]">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        defaultValue={currentClinician.email}
                        onChange={(e) => setCurrentClinician({ ...currentClinician, email: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contactNumber" className="text-[#333]">
                        Contact Number
                      </Label>
                      <Input
                        id="edit-contactNumber"
                        defaultValue={currentClinician.contactNumber}
                        onChange={(e) => setCurrentClinician({ ...currentClinician, contactNumber: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address" className="text-[#333]">
                        Address
                      </Label>
                      <Input
                        id="edit-address"
                        defaultValue={currentClinician.address}
                        onChange={(e) => setCurrentClinician({ ...currentClinician, address: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="academic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-yearLevel" className="text-[#333]">
                        Year Level
                      </Label>
                      <Select
                        defaultValue={currentClinician.yearLevel.split(" ")[0].toLowerCase()}
                        onValueChange={(value) =>
                          setCurrentClinician({
                            ...currentClinician,
                            yearLevel: `${value.charAt(0).toUpperCase() + value.slice(1)} Year`,
                          })
                        }
                      >
                        <SelectTrigger id="edit-yearLevel" className="border-gray-300">
                          <SelectValue placeholder={currentClinician.yearLevel} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5th">5th Year</SelectItem>
                          <SelectItem value="6th">6th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-section" className="text-[#333]">
                        Section
                      </Label>
                      <Select
                        defaultValue={currentClinician.section}
                        onValueChange={(value) =>
                          setCurrentClinician({
                            ...currentClinician,
                            section: value,
                          })
                        }
                      >
                        <SelectTrigger id="edit-section" className="border-gray-300">
                          <SelectValue placeholder={currentClinician.section} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                          <SelectItem value="D">Section D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status" className="text-[#333]">
                        Enrollment Status
                      </Label>
                      <Select
                        defaultValue={currentClinician.status.toLowerCase().replace(" ", "-")}
                        onValueChange={(value) =>
                          setCurrentClinician({
                            ...currentClinician,
                            status: value === "enrolled" ? "Enrolled" : "Not Enrolled",
                          })
                        }
                      >
                        <SelectTrigger id="edit-status" className="border-gray-300">
                          <SelectValue placeholder={currentClinician.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                        </SelectContent>
                      </Select>
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
                  onClick={() => handleUpdateClinician(currentClinician)}
                >
                  Update Clinician
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload CSV Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Upload Clinicians CSV</DialogTitle>
            <DialogDescription className="text-gray-500">
              Upload a CSV file containing clinician information.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-8 flex flex-col items-center justify-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full flex flex-col items-center justify-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-[#333] mb-2">Drag and drop your CSV file</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">or click to browse files from your computer</p>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white">Browse Files</Button>
            </div>
            <div className="mt-6 w-full">
              <h4 className="text-sm font-medium text-[#333] mb-2">CSV Format Requirements:</h4>
              <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                <li>First row must contain column headers</li>
                <li>Required columns: First Name, Last Name, Gender, Status</li>
                <li>Optional columns: Birthday, Email, Contact Number, Address, Year Level, Section</li>
                <li>Status must be either "Enrolled" or "Not Enrolled"</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white">Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clinician Records View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen} className="max-w-4xl">
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden rounded-lg">
          {selectedClinician && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Clinician Records</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Viewing records for {selectedClinician.firstName} {selectedClinician.lastName} - AY 2024-2025, 1st
                      Semester
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-[#e6f7eb] flex items-center justify-center text-[#5C8E77] text-xl font-bold">
                      {selectedClinician.firstName.charAt(0)}
                      {selectedClinician.lastName.charAt(0)}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Clinician ID</h3>
                    <p className="text-[#333] font-medium">{selectedClinician.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Year & Section</h3>
                    <p className="text-[#333] font-medium">
                      {selectedClinician.yearLevel}, Section {selectedClinician.section}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-[#333] font-medium">{selectedClinician.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                    <p className="text-[#333] font-medium">{selectedClinician.contactNumber}</p>
                  </div>
                </div>

                <Tabs defaultValue="activities" className="w-full" onValueChange={(value) => setActiveTab(value)}>
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[300px] grid-cols-2">
                      <TabsTrigger value="activities">Activities</TabsTrigger>
                      <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-[#5C8E77] text-[#5C8E77]"
                        onClick={exportToCSV}
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                  <TabsContent value="activities">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader className="bg-white border-b border-gray-200">
                          <TableRow className="hover:bg-white border-b-0">
                            <TableHead className="font-medium text-[#333]">ID</TableHead>
                            <TableHead className="font-medium text-[#333]">Date</TableHead>
                            <TableHead className="font-medium text-[#333]">Procedure</TableHead>
                            <TableHead className="font-medium text-[#333]">Patient</TableHead>
                            <TableHead className="font-medium text-[#333]">Chair</TableHead>
                            <TableHead className="font-medium text-[#333]">Instructor</TableHead>
                            <TableHead className="font-medium text-[#333]">Grade</TableHead>
                            <TableHead className="font-medium text-[#333]">Status</TableHead>
                            <TableHead className="font-medium text-[#333]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activitiesData.map((activity) => (
                            <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                              <TableCell className="font-medium text-[#333]">{activity.id}</TableCell>
                              <TableCell className="text-[#333]">{activity.date}</TableCell>
                              <TableCell className="text-[#333]">{activity.procedure}</TableCell>
                              <TableCell className="text-[#333]">{activity.patient}</TableCell>
                              <TableCell className="text-[#333]">{activity.chair}</TableCell>
                              <TableCell className="text-[#333]">{activity.instructor}</TableCell>
                              <TableCell className="text-[#333]">{activity.grade}</TableCell>
                              <TableCell>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs inline-flex items-center justify-center font-medium ${
                                    activity.status === "Completed"
                                      ? "bg-blue-50 text-blue-700"
                                      : activity.status === "In Progress"
                                        ? "bg-yellow-50 text-yellow-700"
                                        : "bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {activity.status}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleActivityEditClick(activity)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                                    onClick={() => handleHistoryClick(activity)}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="attendance">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader className="bg-white border-b border-gray-200">
                          <TableRow className="hover:bg-white border-b-0">
                            <TableHead className="font-medium text-[#333]">Date</TableHead>
                            <TableHead className="font-medium text-[#333]">Time In</TableHead>
                            <TableHead className="font-medium text-[#333]">Time Out</TableHead>
                            <TableHead className="font-medium text-[#333]">Sanitized</TableHead>
                            <TableHead className="font-medium text-[#333]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceData.map((attendance) => (
                            <TableRow key={attendance.id} className="hover:bg-gray-50 border-b border-gray-200">
                              <TableCell className="font-medium text-[#333]">{attendance.date}</TableCell>
                              <TableCell className="text-[#333]">{attendance.timeIn}</TableCell>
                              <TableCell className="text-[#333]">{attendance.timeOut}</TableCell>
                              <TableCell className="text-[#333]">{attendance.sanitized}</TableCell>
                              <TableCell>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs inline-flex items-center justify-center font-medium ${
                                    attendance.status === "Present"
                                      ? "bg-[#5C8E77]/10 text-[#5C8E77]"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {attendance.status}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="border-gray-300">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-lg">
          {selectedActivity && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-[#5C8E77] flex items-center gap-2">
                    <History className="h-5 w-5" /> Treatment Record History
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Treatment ID: {selectedActivity.id} - {selectedActivity.procedure}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setIsHistoryModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto bg-[#f8f9fa]">
                <div className="bg-[#f0f7ff] rounded-lg p-4 mb-6">
                  <div className="text-lg font-semibold text-[#333] mb-1">Treatment ID: {selectedActivity.id}</div>
                  <div className="text-sm text-gray-600">
                    {selectedActivity.procedure} - Tooth #{selectedActivity.id.slice(-1)}
                  </div>
                </div>

                <div className="relative border-l-2 border-gray-200 pl-6 space-y-8 py-2">
                  {selectedActivity.history.map((historyItem, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[29px] top-0 h-4 w-4 rounded-full bg-[#5C8E77]"></div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div className="text-sm text-gray-500">
                              {new Date(historyItem.timestamp).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div className="text-sm text-gray-500">{historyItem.user}</div>
                          </div>
                        </div>

                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                            historyItem.action === "Updated"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {historyItem.action === "Updated" ? (
                            <Edit className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {historyItem.action}
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-4">{historyItem.description}</div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">DATE</div>
                            <div className="font-medium">{historyItem.details.date}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">SERVICES RENDERED</div>
                            <div className="font-medium">{historyItem.details.procedure}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">PATIENT</div>
                            <div className="font-medium">{historyItem.details.patient}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">GRADE</div>
                            <div className="font-medium">{historyItem.details.grade || "N/A"}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-gray-500 mb-1">REMARKS</div>
                            <div className="font-medium">{historyItem.details.remarks || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Activity Modal */}
      <Dialog open={isActivityEditModalOpen} onOpenChange={setIsActivityEditModalOpen}>
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
                          Procedure
                        </Label>
                        <Select defaultValue={currentActivity.procedure}>
                          <SelectTrigger id="edit-procedure" className="border-gray-300">
                            <SelectValue placeholder={currentActivity.procedure} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Root Canal Treatment">Root Canal Treatment</SelectItem>
                            <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                            <SelectItem value="Dental Crown">Dental Crown</SelectItem>
                            <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                            <SelectItem value="Dental Extraction">Dental Extraction</SelectItem>
                          </SelectContent>
                        </Select>
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
                <Button variant="outline" onClick={() => setIsActivityEditModalOpen(false)} className="border-gray-300">
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
    </DashboardLayout>
  )
}
