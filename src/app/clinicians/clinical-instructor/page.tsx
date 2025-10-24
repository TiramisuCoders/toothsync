"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Eye, Download, History, X, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Type definitions
interface Clinician {
  id: string // This will be user_id from DB (internal)
  studentId: string // New: student_id from DB (for display)
  firstName: string // from public.users
  lastName: string // from public.users
  gender: string // from public.users (sex)
  status: string // from public.clinicians (enrollment_status)
  birthday: string // from public.users
  email: string // from public.users
  contactNumber: string // from public.users
  address: string // from public.clinicians
  yearLevel: string // from public.clinicians
  section: string // from public.clinicians
}

interface AttendanceRecord {
  id: number
  date: string
  timeIn: string
  timeOut: string
  sanitized: string
  status: string
}

interface HistoryItem {
  timestamp: string
  user: string
  action: string
  description: string
  details: {
    date: string
    procedure: string
    patient: string
    grade: string
    remarks: string
  }
}

interface Activity {
  id: string
  date: string
  procedure: string
  chair: string
  instructor: string
  patient: string
  grade: string
  remarks: string
  status: string
  firstName: string
  lastName: string
  history: HistoryItem[]
  assessmentStatus?: string
}

export default function CliniciansPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "enrolled" | "not-enrolled">("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activeTab, setActiveTab] = useState<"activities" | "attendance">("activities")

  // Sample data for clinicians (reduced to one entry)
  const [clinicians, setClinicians] = useState<Clinician[]>([])

  // Add this useEffect hook and fetchClinicians function
  useEffect(() => {
    fetchClinicians()
  }, [])

  const fetchClinicians = async () => {
    try {
      const response = await fetch("/api/clinicians")
      if (!response.ok) {
        // Log the full response for debugging
        const errorData = await response.json()
        console.error("Failed to fetch clinicians:", response.status, errorData)
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || "Unknown error"}`)
      }
      const data: Clinician[] = await response.json()
      setClinicians(data)
    } catch (error) {
      console.error("Failed to fetch clinicians:", error)
      // Optionally set an error message to display in the UI
    }
  }

  // Sample attendance data (reduced to one entry)
  const [attendanceData] = useState<AttendanceRecord[]>([
    {
      id: 1,
      date: "2025-05-08",
      timeIn: "08:15 AM",
      timeOut: "04:30 PM",
      sanitized: "Yes",
      status: "Present",
    },
  ])

  // Sample activities data (reduced to one entry)
  const [activitiesData] = useState<Activity[]>([
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
  ])

  const handleViewClick = (clinician: Clinician) => {
    setSelectedClinician(clinician)
    setIsViewModalOpen(true)
  }

  const handleHistoryClick = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsHistoryModalOpen(true)
  }

  const exportActivitiesToCSV = () => {
    if (!selectedClinician) return
    const headers = ["ID", "Date", "Procedure", "Patient", "Chair", "Instructor", "Grade", "Status", "Remarks"].join(
      ",",
    )
    const rows = activitiesData.map(
      (activity) =>
        `"${activity.id}","${activity.date}","${activity.procedure}","${activity.patient}","${activity.chair}","${activity.instructor}","${activity.grade}","${activity.status}","${activity.remarks}"`,
    )
    const csv = [headers, ...rows].join("\n")
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

  const exportAttendanceToCSV = () => {
    if (!selectedClinician) return
    const headers = ["Date", "Time In", "Time Out", "Sanitized", "Status"].join(",")
    const rows = attendanceData.map(
      (attendance) =>
        `"${attendance.date}","${attendance.timeIn}","${attendance.timeOut}","${attendance.sanitized}","${attendance.status}"`,
    )
    const csv = [headers, ...rows].join("\n")
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

  const exportToCSV = () => {
    if (activeTab === "activities") {
      exportActivitiesToCSV()
    } else {
      exportAttendanceToCSV()
    }
  }

  const filteredClinicians = clinicians.filter((clinician) => {
    if (activeFilter === "all") return true
    if (activeFilter === "enrolled") return clinician.status === "Enrolled"
    if (activeFilter === "not-enrolled") return clinician.status === "Not Enrolled"
    return true
  })

  return (
    <>
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Student ID</TableHead>
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
                    <TableCell className="font-medium text-[#333]">{clinician.studentId}</TableCell>
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

      {/* Clinician Records View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
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
                    <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
                    <p className="text-[#333] font-medium">{selectedClinician.studentId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Year &amp; Section</h3>
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
                <Tabs
                  defaultValue="activities"
                  className="w-full"
                  onValueChange={(value) => setActiveTab(value as "activities" | "attendance")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-[300px] grid-cols-2">
                      <TabsTrigger value="activities">Activities</TabsTrigger>
                      <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-[#5C8E77] text-[#5C8E77] bg-transparent"
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
                  {selectedActivity.history.map((historyItem: HistoryItem, index: number) => (
                    <div key={index} className="relative">
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
    </>
  )
}