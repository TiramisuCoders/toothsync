"use client"

import { useState } from "react"
import { Edit, Check, X, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InstructorActivitiesContent() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [activityToAction, setActivityToAction] = useState(null)
  const [sortField, setSortField] = useState("id")
  const [sortDirection, setSortDirection] = useState("asc")
  const [activeTab, setActiveTab] = useState("details")

  // Sample data for activities assigned to this instructor
  const [activities, setActivities] = useState([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      patientName: "Juan Dela Cruz",
      chair: "Chair 05",
      date: "2025-05-09",
      procedure: "Root Canal Treatment",
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
      procedure: "Dental Filling",
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
      procedure: "Dental Crown",
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
      procedure: "Teeth Cleaning",
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
      procedure: "Dental Extraction",
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
    setCurrentActivity(activity)
    setIsEditModalOpen(true)
    setActiveTab("details")
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
    <>
      {/* Activities Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-[#333]">Assigned Activities</CardTitle>
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
                <TableHead className="font-medium text-[#333]">Date</TableHead>
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
                    <TableCell className="text-[#333]">{activity.patientName}</TableCell>
                    <TableCell className="text-[#333]">{activity.chair}</TableCell>
                    <TableCell className="text-[#333]">{activity.date}</TableCell>
                    <TableCell className="text-[#333]">{activity.procedure}</TableCell>
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
                        <Label htmlFor="edit-procedure" className="text-[#333]">
                          Procedure
                        </Label>
                        <Select
                          defaultValue={currentActivity.procedure}
                          onValueChange={(value) => setCurrentActivity({ ...currentActivity, procedure: value })}
                        >
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="edit-chair" className="text-[#333]">
                          Chair
                        </Label>
                        <Input
                          id="edit-chair"
                          defaultValue={currentActivity.chair}
                          onChange={(e) => setCurrentActivity({ ...currentActivity, chair: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
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
    </>
  )
}
