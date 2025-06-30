"use client"

import { useState } from "react"
import { Edit, Check, X, ChevronUp, ChevronDown, ArrowUpDown, Star, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export default function InstructorActivitiesContent() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activityToAction, setActivityToAction] = useState(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  const [activeTab, setActiveTab] = useState("details")
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [activityToGrade, setActivityToGrade] = useState(null)
  const [gradeValue, setGradeValue] = useState("")
  const [gradeRemarks, setGradeRemarks] = useState("")
  const [isAddProcedureModalOpen, setIsAddProcedureModalOpen] = useState(false)
  const [selectedProcedures, setSelectedProcedures] = useState([])
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    firstName: "",
    lastName: "",
    patientName: "",
    chair: "",
    procedures: [],
    status: "Not started",
    grade: "",
    assessmentStatus: "Not Started",
    remarks: "",
  })

  // Available procedures
  const availableProcedures = [
    "Root Canal Treatment",
    "Dental Filling",
    "Dental Crown",
    "Teeth Cleaning",
    "Dental Extraction",
    "Dental Implant",
    "Dental Bridge",
    "Teeth Whitening",
    "Dental X-Ray",
    "Orthodontic Adjustment",
  ]

  // Sample data for activities assigned to this instructor
  const [activities, setActivities] = useState([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      patientName: "Juan Dela Cruz",
      chair: "Chair 05",
      date: "2025-05-09",
      procedures: ["Root Canal Treatment", "Dental Filling"],
      status: "Started",
      grade: "",
      assessmentStatus: "In Progress",
      remarks: "",
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      patientName: "Ana Reyes",
      chair: "Chair 12",
      date: "2025-05-09",
      procedures: ["Dental Filling"],
      status: "Not started",
      grade: "",
      assessmentStatus: "Not Started",
      remarks: "",
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      patientName: "Miguel Santos",
      chair: "Chair 03",
      date: "2025-05-09",
      procedures: ["Dental Crown", "Teeth Cleaning", "Dental X-Ray"],
      status: "Started",
      grade: "",
      assessmentStatus: "In Progress",
      remarks: "",
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      patientName: "Sofia Reyes",
      chair: "Chair 08",
      date: "2025-05-09",
      procedures: ["Teeth Cleaning"],
      status: "Completed",
      grade: "85",
      assessmentStatus: "Completed",
      remarks: "Good work, clean execution.",
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      patientName: "Luis Tan",
      chair: "Chair 10",
      date: "2025-05-09",
      procedures: ["Dental Extraction", "Dental X-Ray"],
      status: "Incomplete",
      grade: "60",
      assessmentStatus: "Needs Improvement",
      remarks: "Procedure was not completed properly.",
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
    setCurrentActivity({
      ...activity,
      selectedProcedures: [...activity.procedures],
    })
    setIsEditModalOpen(true)
    setActiveTab("details")
  }

  const handleCompleteClick = (activity) => {
    setActivityToAction(activity)
    setIsCompleteModalOpen(true)
  }

  const handleComplete = () => {
    if (activityToAction) {
      // Update the activity status to Completed
      const updatedActivities = activities.map((activity) =>
        activity.id === activityToAction.id ? { ...activity, status: "Completed" } : activity,
      )
      setActivities(updatedActivities)
      setIsCompleteModalOpen(false)

      // Open the grade modal immediately after marking as completed
      setActivityToGrade(activityToAction)
      setGradeValue(activityToAction.grade || "")
      setGradeRemarks(activityToAction.remarks || "")
      setIsGradeModalOpen(true)

      toast({
        title: "Activity Completed",
        description: `Activity ${activityToAction.id} has been marked as completed.`,
      })
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
      toast({
        title: "Activity Marked Incomplete",
        description: `Activity ${activityToAction.id} has been marked as incomplete.`,
        variant: "destructive",
      })
    }
  }

  // Function to update activity
  const handleUpdateActivity = (updatedActivity) => {
    // Ensure procedures are properly updated
    const proceduresToSave = updatedActivity.selectedProcedures || updatedActivity.procedures

    const finalUpdatedActivity = {
      ...updatedActivity,
      procedures: proceduresToSave,
    }

    // Remove the temporary selectedProcedures field
    delete finalUpdatedActivity.selectedProcedures

    setActivities(
      activities.map((activity) => (activity.id === finalUpdatedActivity.id ? finalUpdatedActivity : activity)),
    )
    setIsEditModalOpen(false)
    toast({
      title: "Activity Updated",
      description: `Activity ${finalUpdatedActivity.id} has been updated successfully.`,
    })
  }

  // Function to handle grading
  const handleGradeActivity = () => {
    if (activityToGrade) {
      const updatedActivities = activities.map((activity) =>
        activity.id === activityToGrade.id
          ? {
              ...activity,
              grade: gradeValue,
              remarks: gradeRemarks,
              assessmentStatus: "Completed",
            }
          : activity,
      )
      setActivities(updatedActivities)
      setIsGradeModalOpen(false)
      toast({
        title: "Activity Graded",
        description: `Grade of ${gradeValue} has been assigned to activity ${activityToGrade.id}.`,
      })
    }
  }

  // Function to handle adding a new procedure to an activity
  const handleAddProcedure = (activity) => {
    setCurrentActivity(activity)
    setSelectedProcedures([])
    setIsAddProcedureModalOpen(true)
  }

  // Function to save added procedures
  const handleSaveAddedProcedures = () => {
    if (currentActivity && selectedProcedures.length > 0) {
      // Create a new set to avoid duplicates
      const updatedProcedures = [...new Set([...currentActivity.procedures, ...selectedProcedures])]

      const updatedActivity = {
        ...currentActivity,
        procedures: updatedProcedures,
      }

      setActivities(activities.map((activity) => (activity.id === currentActivity.id ? updatedActivity : activity)))

      setIsAddProcedureModalOpen(false)
      toast({
        title: "Procedures Added",
        description: `${selectedProcedures.length} procedure(s) added to activity ${currentActivity.id}.`,
      })
    }
  }

  // Function to handle procedure checkbox change
  const handleProcedureChange = (procedure, isChecked) => {
    if (isChecked) {
      setSelectedProcedures([...selectedProcedures, procedure])
    } else {
      setSelectedProcedures(selectedProcedures.filter((p) => p !== procedure))
    }
  }

  // Function to handle procedure checkbox change in edit modal
  const handleEditProcedureChange = (procedure, isChecked) => {
    if (isChecked) {
      setCurrentActivity({
        ...currentActivity,
        selectedProcedures: [...currentActivity.selectedProcedures, procedure],
      })
    } else {
      setCurrentActivity({
        ...currentActivity,
        selectedProcedures: currentActivity.selectedProcedures.filter((p) => p !== procedure),
      })
    }
  }

  // Function to create a new activity
  const handleCreateActivity = () => {
    const newId = (activities.length + 1).toString()
    const activityToAdd = {
      ...newActivity,
      id: newId,
      date: new Date().toISOString().split("T")[0],
    }

    setActivities([...activities, activityToAdd])
    setIsNewActivityModalOpen(false)
    toast({
      title: "Activity Created",
      description: `New activity created for ${newActivity.firstName} ${newActivity.lastName}.`,
    })

    // Reset the form
    setNewActivity({
      firstName: "",
      lastName: "",
      patientName: "",
      chair: "",
      procedures: [],
      status: "Not started",
      grade: "",
      assessmentStatus: "Not Started",
      remarks: "",
    })
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

  // Function to check if a grade is excellent (85 or above)
  const isExcellentGrade = (grade) => {
    const numGrade = Number.parseInt(grade, 10)
    return !isNaN(numGrade) && numGrade >= 85
  }

  return (
    <>
      {/* Activities Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-[#333]">Activities & Grades</CardTitle>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
            onClick={() => setIsNewActivityModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Activity
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
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Patient Name</TableHead>
                <TableHead className="font-medium text-[#333]">Chair</TableHead>
                <TableHead className="font-medium text-[#333]">Procedures</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Grade</TableHead>
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
                    <TableCell className="text-[#333]">{activity.patientName}</TableCell>
                    <TableCell className="text-[#333]">{activity.chair}</TableCell>
                    <TableCell className="text-[#333]">
                      <div className="space-y-1">
                        {activity.procedures &&
                          activity.procedures.map((procedure, index) => (
                            <div key={index} className="text-sm flex items-center">
                              <span className="inline-block w-2 h-2 bg-[#5C8E77] rounded-full mr-2"></span>
                              {procedure}
                            </div>
                          ))}
                      </div>
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
                      {activity.grade ? (
                        <div className="flex items-center">
                          <span className="font-medium">{activity.grade}</span>
                          {isExcellentGrade(activity.grade) && (
                            <Star className="h-4 w-4 text-yellow-500 ml-1 fill-yellow-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
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
                        {activity.status !== "Completed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleCompleteClick(activity)}
                            disabled={activity.status === "Incomplete"}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {activity.status === "Completed" && !activity.grade && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setActivityToGrade(activity)
                              setGradeValue(activity.grade || "")
                              setGradeRemarks(activity.remarks || "")
                              setIsGradeModalOpen(true)
                            }}
                          >
                            Grade
                          </Button>
                        )}
                        {activity.status !== "Incomplete" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveClick(activity)}
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
                    No activities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Activity Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {currentActivity && (
            <>
              <DialogHeader className="bg-white px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Activity</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200">
                  <TabsList className="bg-white h-auto p-0">
                    <TabsTrigger
                      value="details"
                      className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#5C8E77] data-[state=active]:text-[#5C8E77] data-[state=active]:shadow-none rounded-none"
                    >
                      Activity Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="assessment"
                      className="py-3 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#5C8E77] data-[state=active]:text-[#5C8E77] data-[state=active]:shadow-none rounded-none"
                    >
                      Assessment
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="details" className="p-6 m-0">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-activityId" className="text-[#333]">
                          Activity ID
                        </Label>
                        <Input
                          id="edit-activityId"
                          value={currentActivity.id}
                          readOnly
                          className="border-gray-300 bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-chair" className="text-[#333]">
                          Chair
                        </Label>
                        <Select
                          defaultValue={currentActivity.chair}
                          onValueChange={(value) => setCurrentActivity({ ...currentActivity, chair: value })}
                        >
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
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="edit-patientName" className="text-[#333]">
                        Patient
                      </Label>
                      <Input
                        id="edit-patientName"
                        defaultValue={currentActivity.patientName}
                        onChange={(e) => setCurrentActivity({ ...currentActivity, patientName: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#333]">Procedures</Label>
                      <div className="border border-gray-200 rounded-md p-3 max-h-[200px] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {availableProcedures.map((procedure) => (
                            <div key={procedure} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                                checked={currentActivity.selectedProcedures?.includes(procedure)}
                                onCheckedChange={(checked) => handleEditProcedureChange(procedure, checked)}
                              />
                              <label
                                htmlFor={`edit-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                {procedure}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">You can select multiple procedures per activity.</p>
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

                <TabsContent value="assessment" className="p-6 m-0">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-grade" className="text-[#333]">
                          Grade
                        </Label>
                        <Input
                          id="edit-grade"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Enter grade (0-100)"
                          defaultValue={currentActivity.grade}
                          onChange={(e) => setCurrentActivity({ ...currentActivity, grade: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-assessmentStatus" className="text-[#333]">
                          Assessment Status
                        </Label>
                        <Select
                          defaultValue={currentActivity.assessmentStatus}
                          onValueChange={(value) => setCurrentActivity({ ...currentActivity, assessmentStatus: value })}
                        >
                          <SelectTrigger id="edit-assessmentStatus" className="border-gray-300">
                            <SelectValue placeholder={currentActivity.assessmentStatus || "In Progress"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-remarks" className="text-[#333]">
                        Remarks
                      </Label>
                      <Textarea
                        id="edit-remarks"
                        placeholder="Enter instructor feedback or clinical observations"
                        defaultValue={currentActivity.remarks}
                        onChange={(e) => setCurrentActivity({ ...currentActivity, remarks: e.target.value })}
                        className="border-gray-300 min-h-[150px]"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="bg-white px-6 py-4 border-t border-gray-200">
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
                <p className="font-medium text-[#333]">
                  {activityToAction.procedures?.length > 0
                    ? activityToAction.procedures.join(", ")
                    : "No procedures specified"}
                </p>
                <p className="text-sm text-[#5C8E77]">
                  {activityToAction.firstName} {activityToAction.lastName} • {activityToAction.chair}
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-gray-500">
              After marking as completed, you'll be prompted to grade this activity.
            </p>
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
                <p className="font-medium text-[#333]">
                  {activityToAction.procedures?.length > 0
                    ? activityToAction.procedures.join(", ")
                    : "No procedures specified"}
                </p>
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

      {/* Grade Activity Modal */}
      <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Grade Activity</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {activityToGrade && (
              <>
                <div className="mb-4 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#333]">
                        {activityToGrade.procedures?.length > 0
                          ? activityToGrade.procedures.join(", ")
                          : "No procedures specified"}
                      </p>
                      <p className="text-sm text-[#5C8E77]">
                        {activityToGrade.firstName} {activityToGrade.lastName} • {activityToGrade.chair}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Patient: {activityToGrade.patientName}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(activityToGrade.status)}>
                      {activityToGrade.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-[#333] font-medium">
                      Grade (0-100)
                    </Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter grade"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      className="border-gray-300"
                    />
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="flex items-center mr-3">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>Excellent (85-100)</span>
                      </div>
                      <span>Pass (75-84)</span>
                      <span className="mx-3">|</span>
                      <span className="text-red-500">Fail (Below 75)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="text-[#333] font-medium">
                      Feedback & Remarks
                    </Label>
                    <Textarea
                      id="remarks"
                      placeholder="Enter feedback for the clinician"
                      value={gradeRemarks}
                      onChange={(e) => setGradeRemarks(e.target.value)}
                      className="border-gray-300 min-h-[120px]"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
              onClick={handleGradeActivity}
              disabled={!gradeValue}
            >
              Submit Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Procedure Modal */}
      <Dialog open={isAddProcedureModalOpen} onOpenChange={setIsAddProcedureModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Add Procedures</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {currentActivity && (
              <>
                <div className="mb-4 p-3 bg-[#f8f9fa] rounded-md border border-gray-200">
                  <p className="font-medium text-[#333]">
                    Adding procedures to activity for {currentActivity.firstName} {currentActivity.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current procedures:{" "}
                    {currentActivity.procedures?.length > 0 ? currentActivity.procedures.join(", ") : "None"}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-[#333] font-medium">Select Additional Procedures</Label>
                  <div className="border border-gray-200 rounded-md p-3 max-h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {availableProcedures
                        .filter((procedure) => !currentActivity.procedures?.includes(procedure))
                        .map((procedure) => (
                          <div key={procedure} className="flex items-center space-x-2">
                            <Checkbox
                              id={`add-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                              checked={selectedProcedures.includes(procedure)}
                              onCheckedChange={(checked) => handleProcedureChange(procedure, checked)}
                            />
                            <label
                              htmlFor={`add-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {procedure}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select the additional procedures you want to add to this activity.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsAddProcedureModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
              onClick={handleSaveAddedProcedures}
              disabled={selectedProcedures.length === 0}
            >
              Add Procedures
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Activity Modal */}
      <Dialog open={isNewActivityModalOpen} onOpenChange={setIsNewActivityModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Create New Activity</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-firstName" className="text-[#333]">
                    First Name
                  </Label>
                  <Input
                    id="new-firstName"
                    value={newActivity.firstName}
                    onChange={(e) => setNewActivity({ ...newActivity, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-lastName" className="text-[#333]">
                    Last Name
                  </Label>
                  <Input
                    id="new-lastName"
                    value={newActivity.lastName}
                    onChange={(e) => setNewActivity({ ...newActivity, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="border-gray-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-patientName" className="text-[#333]">
                  Patient Name
                </Label>
                <Input
                  id="new-patientName"
                  value={newActivity.patientName}
                  onChange={(e) => setNewActivity({ ...newActivity, patientName: e.target.value })}
                  placeholder="Enter patient name"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-chair" className="text-[#333]">
                  Chair
                </Label>
                <Select onValueChange={(value) => setNewActivity({ ...newActivity, chair: value })}>
                  <SelectTrigger id="new-chair" className="border-gray-300">
                    <SelectValue placeholder="Select chair" />
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
                <Label className="text-[#333]">Procedures</Label>
                <div className="border border-gray-200 rounded-md p-3 max-h-[200px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {availableProcedures.map((procedure) => (
                      <div key={procedure} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                          checked={newActivity.procedures?.includes(procedure)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewActivity({
                                ...newActivity,
                                procedures: [...(newActivity.procedures || []), procedure],
                              })
                            } else {
                              setNewActivity({
                                ...newActivity,
                                procedures: newActivity.procedures?.filter((p) => p !== procedure) || [],
                              })
                            }
                          }}
                        />
                        <label
                          htmlFor={`new-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {procedure}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">You can select multiple procedures per activity.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status" className="text-[#333]">
                  Status
                </Label>
                <Select
                  defaultValue="Not started"
                  onValueChange={(value) => setNewActivity({ ...newActivity, status: value })}
                >
                  <SelectTrigger id="new-status" className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not started">Not started</SelectItem>
                    <SelectItem value="Started">Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsNewActivityModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
              onClick={handleCreateActivity}
              disabled={
                !newActivity.firstName ||
                !newActivity.lastName ||
                !newActivity.patientName ||
                !newActivity.chair ||
                !newActivity.procedures?.length
              }
            >
              Create Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
