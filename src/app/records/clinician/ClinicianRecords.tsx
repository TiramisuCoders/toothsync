// pagination and filters

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, FileText, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ProcedureDetail {
  name: string
  grade?: string
  remarks?: string
  status?: string
}

export interface Activity {
  id: string
  firstName?: string
  lastName?: string
  chair?: string
  patientName: string
  instructorId: string
  instructorName: string
  procedures: string[]
  procedureDetails?: ProcedureDetail[]
  status: string
  date: string
  grade?: string
  gradeStatus?: string
  remarks?: string
  feedback?: string
  timeIn: string
  timeOut: string
}

export default function ClinicianRecords() {
  const [activeTab, setActiveTab] = useState("activities")
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activitiesData, setActivitiesRecords] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)  

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)
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

      } catch (err) {
        // console.error("Error fetching attendance:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch records")
      } finally {
        setLoading(false)
      }
    }


  const getGradeColor = (grade?: string) => {
    if (!grade) return "text-gray-400"
    const numGrade = Number.parseInt(grade)
    if (numGrade >= 90) return "text-green-600 font-semibold"
    if (numGrade >= 80) return "text-blue-600 font-semibold"
    if (numGrade >= 75) return "text-yellow-600 font-semibold"
    return "text-red-600 font-semibold"
  }

  const getGradeStatus = (grade?: string) => {
    if (!grade) return undefined
    const numGrade = Number.parseInt(grade)
    return numGrade >= 75 ? "Passed" : "Failed"
  }

  const getGradeStatusColor = (grade?: string) => {
    const status = getGradeStatus(grade)
    return status === "Passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

    // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading records...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPages = Math.ceil(activitiesData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = activitiesData.slice(startIndex, endIndex)
  

  return (
    <div className="space-y-6">

    {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-red-600"
                  onClick={fetchRecords}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

      <h1 className="text-2xl font-semibold text-gray-800">Records</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          {/* <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button> */}
        </div>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Activity ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.id}</TableCell>
                      <TableCell>{activity.patientName}</TableCell>
                      <TableCell>
                        {activity.procedures && activity.procedures.length > 0 ? (
                          <div className="space-y-1">
                            {activity.procedures.map((proc, index) => (
                              <div key={index} className="text-sm">
                                {proc}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{activity.date}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.status === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : activity.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : activity.status === "Cancelled"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
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
                              // console.log('Selected Activity:', activity)
                              // console.log('Procedure Details:', activity.procedureDetails)
                              // console.log(`Procedure Details: ${activity.procedureDetails}`);

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
               {/* Pagination Controls */}
          {activitiesData.length > 0 && (
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
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, activitiesData.length)} of {activitiesData.length}
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
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="font-semibold">Attendance ID</TableHead> */}
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Time In</TableHead>
                    <TableHead className="font-semibold">Time Out</TableHead>
                    {/* <TableHead className="font-semibold">Chair</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Sanitized</TableHead>
                    <TableHead className="font-semibold">Status</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((attendance) => (
                    <TableRow key={attendance.id}>
                      {/* <TableCell>{attendance.id}</TableCell> */}
                      <TableCell>{attendance.date}</TableCell>
                      <TableCell>{attendance.timeIn}</TableCell>
                      <TableCell>{attendance.timeOut}</TableCell>
                      {/* <TableCell>{attendance.chair}</TableCell>
                      <TableCell>
                        {Array.isArray(attendance.procedures) ? (
                          <div className="space-y-1">
                            {attendance.procedures.map((proc, index) => (
                              <div key={index} className="text-sm">
                                {proc}
                              </div>
                            ))}
                          </div>
                        ) : (
                          attendance.procedures
                        )}
                      </TableCell>
                      <TableCell>{attendance.sanitize}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{attendance.status}</Badge>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

               {/* Pagination Controls */}
          {activitiesData.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, activitiesData.length)} of {activitiesData.length}
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
        </TabsContent>
      </Tabs>

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-lg">
          {selectedActivity && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Activity Details</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  View detailed information about this activity including procedures, grades, and remarks.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Activity ID</p>
                      <p className="font-medium">{selectedActivity.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{selectedActivity.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Instructor</p>
                      <p className="font-medium">{selectedActivity.instructorName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chair</p>
                      <p className="font-medium">{selectedActivity.chair || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="font-medium">{selectedActivity.patientName}</p>
                    </div>
                  </div>
                </div>

                {selectedActivity.procedureDetails && selectedActivity.procedureDetails.length > 0 ? (
                  selectedActivity.procedureDetails.length > 1 ? (
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList
                        className="grid w-full"
                        style={{ gridTemplateColumns: `repeat(${selectedActivity.procedureDetails.length}, 1fr)` }}
                      >
                        {selectedActivity.procedureDetails.map((procedure, index) => (
                          <TabsTrigger key={index} value={index.toString()}>
                            Procedure {index + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {selectedActivity.procedureDetails.map((procedure, index) => (
                        <TabsContent key={index} value={index.toString()} className="mt-4">
                          <div className="grid gap-4 p-4 border rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Procedure</p>
                                <p className="font-medium">{procedure.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge
                                  className={
                                    procedure.status === "Completed"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : procedure.status === "In Progress"
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  }
                                >
                                  {procedure.status || selectedActivity.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              
                              <div>
                                <p className="text-sm text-gray-500">Grade</p>
                                {procedure.grade ? (
                                  <div className="flex items-center gap-2">
                                    <p className={`font-medium ${getGradeColor(procedure.grade)}`}>
                                      {procedure.grade}
                                    </p>
                                    {Number.parseInt(procedure.grade) >= 90 && (
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                    {/* <Badge
                                      className={`text-xs ${getGradeStatusColor(procedure.grade)}`}
                                    >
                                      {getGradeStatus(procedure.grade)}
                                    </Badge> */}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500 mb-1">Remarks</p>
                              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                <p className="text-gray-700">
                                  {procedure.remarks || "No remarks available"}
                                </p>
                              </div>
                            </div>

                            {procedure.grade && getGradeStatus(procedure.grade) === "Failed" && (
                              <div className="p-3 bg-red-50 rounded-md border border-red-200">
                                <p className="text-sm font-medium text-red-700 mb-1">Remediation Required</p>
                                <p className="text-sm text-red-600">
                                  Please schedule a review session with your instructor to address the areas needing improvement.
                                </p>
                              </div>
                            )}
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
                          <p className="font-medium">{selectedActivity.procedureDetails[0].name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge
                            className={
                              selectedActivity.procedureDetails[0].status === "Completed"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : selectedActivity.procedureDetails[0].status === "In Progress"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            }
                          >
                            {selectedActivity.procedureDetails[0].status || selectedActivity.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Instructor</p>
                          <p className="font-medium">{selectedActivity.instructorName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Grade</p>
                          {selectedActivity.procedureDetails[0].grade ? (
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${getGradeColor(selectedActivity.procedureDetails[0].grade)}`}>
                                {selectedActivity.procedureDetails[0].grade}
                              </p>
                              {Number.parseInt(selectedActivity.procedureDetails[0].grade) >= 90 && (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                              <Badge
                                className={`text-xs ${getGradeStatusColor(selectedActivity.procedureDetails[0].grade)}`}
                              >
                                {getGradeStatus(selectedActivity.procedureDetails[0].grade)}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Remarks</p>
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <p className="text-gray-700">
                            {selectedActivity.procedureDetails[0].remarks || "No remarks available"}
                          </p>
                        </div>
                      </div>

                      {selectedActivity.procedureDetails[0].grade && 
                       getGradeStatus(selectedActivity.procedureDetails[0].grade) === "Failed" && (
                        <div className="p-3 bg-red-50 rounded-md border border-red-200">
                          <p className="text-sm font-medium text-red-700 mb-1">Remediation Required</p>
                          <p className="text-sm text-red-600">
                            Please schedule a review session with your instructor to address the areas needing improvement.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  // Fallback when no procedure details are available
                  <div className="grid gap-4 p-4 border rounded-lg">
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">No detailed procedure information available</p>
                      <p className="text-sm text-gray-400">
                        This activity may not have detailed grading data yet.
                      </p>
                    </div>
                    
                    {/* Show basic activity info as fallback */}
                    {selectedActivity.procedures && selectedActivity.procedures.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Procedures:</p>
                        <div className="space-y-1">
                          {selectedActivity.procedures.map((proc, index) => (
                            <p key={index} className="text-sm font-medium">{proc}</p>
                          ))}
                        </div>
                      </div>
                    )}
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