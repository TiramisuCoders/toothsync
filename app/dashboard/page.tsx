"use client"

import { useState } from "react"
import { Calendar, ChevronDown, Plus, Edit, Check, X, ChevronUp, User, Users, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activityToAction, setActivityToAction] = useState(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  const [isReportsOpen, setIsReportsOpen] = useState(false)

  // Centralized data - Admin perspective as baseline
  const [cliniciansLoggedIn, setCliniciansLoggedIn] = useState(24)
  const [availableInstructors, setAvailableInstructors] = useState(3) // Changed to reflect fewer instructors
  const [availableChairs, setAvailableChairs] = useState(15)

  // Initial activities data
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
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      chair: "Chair 10",
      patient: "Luis Tan",
      instructor: "Dr. Tan",
      procedure: "Dental Extraction",
      procedures: ["Dental Extraction", "Root Canal Treatment"],
      status: "Incomplete",
    },
  ])

  // Calculate distribution - ensure equal distribution with remainder handling
  const calculateDistribution = (totalClinicians, totalInstructors) => {
    if (totalInstructors === 0) return []

    const baseCount = Math.floor(totalClinicians / totalInstructors)
    const remainder = totalClinicians % totalInstructors

    // Create array of instructors
    const instructors = ["Dr. Reyes", "Dr. Mendoza", "Dr. Santos"]

    // Create distribution array
    return instructors.slice(0, totalInstructors).map((instructor, index) => {
      // Add one extra to the first 'remainder' instructors to handle uneven distribution
      return {
        instructor,
        clinicians: baseCount + (index < remainder ? 1 : 0),
      }
    })
  }

  // Generate instructor distribution
  const instructorDistribution = calculateDistribution(cliniciansLoggedIn, availableInstructors)

  // Get current date
  const today = new Date()
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = today.toLocaleDateString("en-US", options)

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
      setActivities(
        activities.map((activity) =>
          activity.id === activityToAction.id ? { ...activity, status: "Completed" } : activity,
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
      setActivities(
        activities.map((activity) =>
          activity.id === activityToAction.id ? { ...activity, status: "Incomplete" } : activity,
        ),
      )
      setIsArchiveModalOpen(false)
    }
  }

  // Function to update activity
  const handleUpdateActivity = (updatedActivity) => {
    setActivities(activities.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity)))
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
    <DashboardLayout currentRole="admin">
      <div className="flex h-full bg-[#f8f9fa]" style={poppinsFont}>
        {/* Sidebar */}
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Greeting */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#333]">Good morning, Admin!</h2>
              <p className="text-gray-500">{formattedDate}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">TOTAL CLINICIANS</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-0">
                  <div className="text-4xl font-semibold text-[#333]">{cliniciansLoggedIn}</div>
                  <div className="h-12 w-12 rounded-full bg-[#e6f7eb] flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#5C8E77]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">AVAILABLE INSTRUCTORS</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-0">
                  <div className="text-4xl font-semibold text-[#333]">{availableInstructors}</div>
                  <div className="h-12 w-12 rounded-full bg-[#e6f7eb] flex items-center justify-center">
                    <User className="h-6 w-6 text-[#5C8E77]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">AVAILABLE CHAIRS</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-0">
                  <div className="text-4xl font-semibold text-[#333]">{availableChairs}</div>
                  <div className="h-12 w-12 rounded-full bg-[#e6f7eb] flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#5C8E77]"
                    >
                      <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8" />
                      <path d="M18 15l-2-2" />
                      <path d="M18 15l-2 2" />
                      <path d="M5 18h3" />
                      <path d="M2 18h1" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">TODAY'S ACTIVITIES</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-0">
                  <div className="text-4xl font-semibold text-[#333]">{activities.length}</div>
                  <div className="h-12 w-12 rounded-full bg-[#e6f7eb] flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-[#5C8E77]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructor-Clinician Distribution */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <CardTitle className="text-xl font-semibold text-[#333]">Clinician Distribution</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Equal distribution of {cliniciansLoggedIn} clinicians among {availableInstructors} available
                    instructors
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white border-b border-gray-200">
                    <TableRow className="hover:bg-white border-b-0">
                      <TableHead className="font-medium text-[#333]">Instructor</TableHead>
                      <TableHead className="font-medium text-[#333] text-right">Assigned Clinicians</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorDistribution.length > 0 ? (
                      instructorDistribution.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-200">
                          <TableCell className="font-medium text-[#333]">{item.instructor}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-[#333]">{item.clinicians}</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-[#5C8E77] h-2.5 rounded-full"
                                  style={{
                                    width: `${(item.clinicians / Math.max(...instructorDistribution.map((i) => i.clinicians))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-gray-500">
                          No instructors available today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="p-4 text-sm text-gray-500 border-t border-gray-200">
                  <p>
                    <span className="font-medium">Note:</span> Clinician distribution is automatically balanced based on
                    the number of available instructors each day. The system ensures an equal distribution with minimal
                    variance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activities Table */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <CardTitle className="text-xl font-semibold text-[#333]">Today's Activities</CardTitle>
                </div>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-4 w-4" /> New Activity
                </Button>
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
                      <TableHead
                        className="font-medium text-[#333] cursor-pointer"
                        onClick={() => handleSort("lastName")}
                      >
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
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          No activities scheduled for today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>

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
                        <SelectItem value="Dr. Reyes">Dr. Reyes</SelectItem>
                        <SelectItem value="Dr. Mendoza">Dr. Mendoza</SelectItem>
                        <SelectItem value="Dr. Santos">Dr. Santos</SelectItem>
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
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
            {currentActivity && (
              <>
                <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                  <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Activity</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
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
    </DashboardLayout>
  )
}
