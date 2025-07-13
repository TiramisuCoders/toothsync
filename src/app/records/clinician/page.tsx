"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, FileText, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Sample clinician data
const clinicianData = {
  id: "CLIN-001",
  firstName: "Maria",
  lastName: "Santos",
  course: "Doctor of Dental Medicine",
  year: "5th Year", // Updated to 5th Year
  section: "A", // Added section
  assignedChair: "Chair 2",
  instructor: "Doc. Sales",
  email: "maria.santos@example.com",
  contactNumber: "+63 912 345 6789",
}

// Sample activities data with grades integrated
const activitiesData = [
  {
    id: "ACT-001",
    patientName: "Maria Santos",
    chair: "Chair 1",
    procedure: "Tooth Extraction",
    procedures: ["Tooth Extraction", "Dental Cleaning"],
    date: "2025-05-09T09:30:00",
    status: "Completed",
    gradeId: "GRD-001",
    grade: "92",
    gradeStatus: "Passed",
    instructor: "Dr. Reyes",
    feedback: "Excellent technique and patient management. Good handling of instruments.",
  },
  {
    id: "ACT-002",
    patientName: "Pedro Penduko",
    chair: "Chair 3",
    procedure: "Dental Cleaning",
    date: "2025-05-09T11:00:00",
    status: "In Progress",
  },
  {
    id: "ACT-003",
    patientName: "Jose Rizal",
    chair: "Chair 2",
    procedure: "Dental Filling",
    procedures: ["Dental Filling", "Consultation"],
    date: "2025-05-09T14:00:00",
    status: "Pending",
  },
  {
    id: "ACT-004",
    patientName: "Andres Bonifacio",
    chair: "Chair 4",
    procedure: "Root Canal",
    date: "2025-05-08T10:15:00",
    status: "Completed",
    gradeId: "GRD-002",
    grade: "88",
    gradeStatus: "Passed",
    instructor: "Dr. Mendoza",
    feedback: "Good canal preparation. Could improve on obturation technique.",
  },
  {
    id: "ACT-005",
    patientName: "Emilio Aguinaldo",
    chair: "Chair 2",
    procedure: "Dental Implant",
    procedures: ["Dental Implant", "X-Ray"],
    date: "2025-05-07T13:45:00",
    status: "Completed",
    gradeId: "GRD-003",
    grade: "95",
    gradeStatus: "Passed",
    instructor: "Dr. Santos",
    feedback: "Outstanding implant placement. Excellent tissue management and suturing.",
  },
  {
    id: "ACT-006",
    patientName: "Gabriel Lim",
    chair: "Chair 1",
    procedure: "Dental Crown",
    date: "2025-05-06T10:30:00",
    status: "Completed",
    gradeId: "GRD-004",
    grade: "78",
    gradeStatus: "Passed",
    instructor: "Dr. Tan",
    feedback: "Acceptable margin preparation. Need to improve on temporization.",
  },
  {
    id: "ACT-007",
    patientName: "Elena Cruz",
    chair: "Chair 3",
    procedure: "Dental Filling",
    date: "2025-05-05T14:15:00",
    status: "Completed",
    gradeId: "GRD-005",
    grade: "65",
    gradeStatus: "Failed",
    instructor: "Dr. Santos",
    feedback: "Inadequate caries removal. Poor composite layering technique. Please review and practice more.",
  },
]

// Sample attendance data
const attendanceData = [
  {
    id: "ATT-001",
    timeIn: "2025-05-09T08:30:00",
    timeOut: "2025-05-09T16:30:00",
    chair: "Chair 1",
    procedure: "Tooth Extraction",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-002",
    timeIn: "2025-05-08T08:45:00",
    timeOut: "2025-05-08T16:15:00",
    chair: "Chair 3",
    procedure: "Dental Cleaning",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-003",
    timeIn: "2025-05-07T09:00:00",
    timeOut: "2025-05-07T17:00:00",
    chair: "Chair 2",
    procedure: "Dental Filling",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-004",
    timeIn: "2025-05-06T08:30:00",
    timeOut: "2025-05-06T16:30:00",
    chair: "Chair 4",
    procedure: "Root Canal",
    sanitized: "Yes",
    status: "Present",
  },
]

export default function ClinicianRecords() {
  const [activeTab, setActiveTab] = useState("activities")
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)

  // Function to handle CSV export (mock)
  const handleExportCSV = () => {
    alert("Exporting CSV...")
  }

  // Function to get grade status color
  const getGradeStatusColor = (status) => {
    return status === "Passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  // Function to get grade color
  const getGradeColor = (grade) => {
    const numGrade = Number.parseInt(grade)
    if (numGrade >= 90) return "text-green-600 font-semibold"
    if (numGrade >= 80) return "text-blue-600 font-semibold"
    if (numGrade >= 75) return "text-yellow-600 font-semibold"
    return "text-red-600 font-semibold"
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Records</h1>

      {/* Clinician Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Clinician Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">
                {clinicianData.firstName} {clinicianData.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="font-semibold">{clinicianData.course}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-semibold">{clinicianData.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-semibold">{clinicianData.section}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{clinicianData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Number</p>
              <p className="font-semibold">{clinicianData.contactNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Activities and Attendance */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Activities Tab Content with Grades integrated */}
        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Act ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Grade</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesData.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.id}</TableCell>
                      <TableCell>{activity.patientName}</TableCell>
                      <TableCell>
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
                      <TableCell>{format(new Date(activity.date), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.status === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : activity.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.grade ? (
                          <div className={getGradeColor(activity.grade)}>
                            <div className="flex items-center">
                              {activity.grade}
                              {Number.parseInt(activity.grade) >= 90 && (
                                <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.grade && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedActivity(activity)
                              setIsFeedbackModalOpen(true)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab Content */}
        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Attendance ID</TableHead>
                    <TableHead className="font-semibold">Time In</TableHead>
                    <TableHead className="font-semibold">Time Out</TableHead>
                    <TableHead className="font-semibold">Chair</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Sanitized</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>{attendance.id}</TableCell>
                      <TableCell>{format(new Date(attendance.timeIn), "h:mm a")}</TableCell>
                      <TableCell>{format(new Date(attendance.timeOut), "h:mm a")}</TableCell>
                      <TableCell>{attendance.chair}</TableCell>
                      <TableCell>{attendance.procedure}</TableCell>
                      <TableCell>{attendance.sanitized}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{attendance.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Detail Modal */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {selectedActivity && selectedActivity.grade && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Assessment Feedback</DialogTitle>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Activity ID</p>
                      <p className="font-medium">{selectedActivity.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Grade ID</p>
                      <p className="font-medium">{selectedActivity.gradeId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Procedure</p>
                      <p className="font-medium">
                        {selectedActivity.procedures
                          ? selectedActivity.procedures.join(", ")
                          : selectedActivity.procedure}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="font-medium">{selectedActivity.patientName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{format(new Date(selectedActivity.date), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Instructor</p>
                      <p className="font-medium">{selectedActivity.instructor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className={`font-medium ${getGradeColor(selectedActivity.grade)}`}>
                        {selectedActivity.grade}
                        {Number.parseInt(selectedActivity.grade) >= 90 && (
                          <Star className="inline h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={getGradeStatusColor(selectedActivity.gradeStatus)}>
                        {selectedActivity.gradeStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Instructor Feedback</p>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-gray-700">{selectedActivity.feedback}</p>
                    </div>
                  </div>

                  {selectedActivity.gradeStatus === "Failed" && (
                    <div className="p-3 bg-red-50 rounded-md border border-red-200">
                      <p className="text-sm font-medium text-red-700 mb-1">Remediation Required</p>
                      <p className="text-sm text-red-600">
                        Please schedule a review session with your instructor to address the areas needing improvement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsFeedbackModalOpen(false)} className="border-gray-300">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}