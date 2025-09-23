// records > clinician

"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, FileText, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export interface Activity {
  id: string
  firstName: string
  lastName: string
  chair: string
  patientName: string
  instructor: string
  procedures: string[]
  status: string
  date: string
  grade?: string
  gradeStatus?: string
  remarks?: string
  feedback?: string
}

export interface Attendance {
  id: string
  timeIn: string
  timeOut: string
  chair: string
  procedures: string
  status: string
  sanitize: string
}

export default function ClinicianRecords() {
  const [activeTab, setActiveTab] = useState("activities")
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [activitiesData, setActivitiesRecords] = useState<Activity[]>([])
  const [attendanceData, setAttendanceRecords] = useState<Attendance[]>([])

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const fetchRecords = await fetch("/api/records/clinician", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!fetchRecords.ok) {
          throw new Error(`HTTP error! status: ${fetchRecords.status}`)
        }

        const records = await fetchRecords.json()

        if (records.success) {
          setActivitiesRecords(records.data)
        } else {
          throw new Error(records.error || "Failed to fetch records")
        }

        const fecthAttendance = await fetch("/api/attendance/clinicians", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!fecthAttendance.ok) {
          throw new Error(`HTTP error! status: ${fecthAttendance.status}`)
        }

        const attendance = await fecthAttendance.json()

        if (attendance.success) {
          setAttendanceRecords(attendance.data)
        } else {
          throw new Error(attendance.error || "Failed to fetch records")
        }
      } catch (err) {
        console.error("Error fetching attendance:", err)
        // setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }

    fetchRecords()
  }, [])
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

  // Function to safely format dates
  const formatDate = (dateString: string, formatStr = "MMM d, yyyy h:mm a") => {
    if (!dateString) return "—"

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"

    return format(date, formatStr)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Records</h1>

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
                      {/* Simplified date display */}
                      <TableCell>—</TableCell>
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
                        {activity.status === "Completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 bg-transparent"
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
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{attendance.chair}</TableCell>
                      <TableCell>{attendance.procedures}</TableCell>
                      <TableCell>{attendance.sanitize}</TableCell>
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

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-lg">
          {selectedActivity && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Activity Details</DialogTitle>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Act ID</p>
                      <p className="font-medium">{selectedActivity.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="font-medium">{selectedActivity.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">—</p>
                    </div>
                  </div>
                </div>

                {selectedActivity.procedures &&
                Array.isArray(selectedActivity.procedures) &&
                selectedActivity.procedures.length > 1 ? (
                  <Tabs defaultValue="0" className="w-full">
                    <TabsList
                      className="grid w-full"
                      style={{ gridTemplateColumns: `repeat(${selectedActivity.procedures.length}, 1fr)` }}
                    >
                      {selectedActivity.procedures.map((procedure, index) => (
                        <TabsTrigger key={index} value={index.toString()}>
                          Procedure {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {selectedActivity.procedures.map((procedure, index) => (
                      <TabsContent key={index} value={index.toString()} className="mt-4">
                        <div className="grid gap-4 p-4 border rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Procedure</p>
                              <p className="font-medium">{procedure}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <Badge
                                className={
                                  selectedActivity.status === "Completed"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : selectedActivity.status === "In Progress"
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }
                              >
                                {selectedActivity.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Instructor</p>
                              <p className="font-medium">{selectedActivity.instructor || "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Grade</p>
                              {selectedActivity.grade ? (
                                <p className={`font-medium ${getGradeColor(selectedActivity.grade)}`}>
                                  {selectedActivity.grade}
                                  {Number.parseInt(selectedActivity.grade) >= 90 && (
                                    <Star className="inline h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                                  )}
                                </p>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Remarks</p>
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                              <p className="text-gray-700">
                                {selectedActivity.remarks || selectedActivity.feedback || "No remarks available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  // Single procedure display
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Procedure</p>
                        <p className="font-medium">
                          {selectedActivity.procedures && Array.isArray(selectedActivity.procedures)
                            ? selectedActivity.procedures[0]
                            : selectedActivity.procedures || selectedActivity.procedure}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge
                          className={
                            selectedActivity.status === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : selectedActivity.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {selectedActivity.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Instructor</p>
                        <p className="font-medium">{selectedActivity.instructor || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Grade</p>
                        {selectedActivity.grade ? (
                          <p className={`font-medium ${getGradeColor(selectedActivity.grade)}`}>
                            {selectedActivity.grade}
                            {Number.parseInt(selectedActivity.grade) >= 90 && (
                              <Star className="inline h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                            )}
                          </p>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Remarks</p>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-700">
                          {selectedActivity.remarks || selectedActivity.feedback || "No remarks available"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedActivity.gradeStatus === "Failed" && (
                  <div className="p-3 bg-red-50 rounded-md border border-red-200 mt-4">
                    <p className="text-sm font-medium text-red-700 mb-1">Remediation Required</p>
                    <p className="text-sm text-red-600">
                      Please schedule a review session with your instructor to address the areas needing improvement.
                    </p>
                  </div>
                )}
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
