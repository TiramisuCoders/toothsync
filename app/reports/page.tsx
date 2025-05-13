"use client"

import { useState } from "react"
import { Download, Edit, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DashboardLayout } from "@/components/dashboard-layout"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2024-2025")
  const [selectedSemester, setSelectedSemester] = useState("1st")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null)
  const [newAcademicYear, setNewAcademicYear] = useState({
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    semester: "1st",
    status: "Inactive",
  })

  // Sample data for academic years
  const academicYears = [
    {
      id: "AY2024-001",
      academicYear: "2024-2025",
      semester: "1st",
      status: "Active",
    },
    {
      id: "AY2023-002",
      academicYear: "2023-2024",
      semester: "2nd",
      status: "Inactive",
    },
    {
      id: "AY2023-001",
      academicYear: "2023-2024",
      semester: "1st",
      status: "Inactive",
    },
    {
      id: "AY2022-002",
      academicYear: "2022-2023",
      semester: "2nd",
      status: "Inactive",
    },
    {
      id: "AY2022-001",
      academicYear: "2022-2023",
      semester: "1st",
      status: "Inactive",
    },
  ]

  // Sample data for clinician history
  const clinicianHistory = [
    {
      id: "C2024-001",
      firstName: "Maria",
      lastName: "Santos",
      yearLevel: "3rd Year",
      section: "A",
      gender: "Female",
      status: "Enrolled",
    },
    {
      id: "C2024-002",
      firstName: "John",
      lastName: "Dela Cruz",
      yearLevel: "4th Year",
      section: "B",
      gender: "Male",
      status: "Enrolled",
    },
    {
      id: "C2024-003",
      firstName: "Anna",
      lastName: "Lim",
      yearLevel: "3rd Year",
      section: "A",
      gender: "Female",
      status: "Not Enrolled",
    },
    {
      id: "C2024-004",
      firstName: "Mark",
      lastName: "Aquino",
      yearLevel: "4th Year",
      section: "C",
      gender: "Male",
      status: "Enrolled",
    },
  ]

  // Sample data for activity history
  const activityHistory = [
    {
      id: "A2024-001",
      firstName: "Maria",
      lastName: "Santos",
      chair: "Chair 1",
      instructor: "Dr. Reyes",
      procedure: "Dental Cleaning",
      date: "2024-05-15",
    },
    {
      id: "A2024-002",
      firstName: "John",
      lastName: "Dela Cruz",
      chair: "Chair 3",
      instructor: "Dr. Santos",
      procedure: "Tooth Extraction",
      date: "2024-05-16",
    },
    {
      id: "A2024-003",
      firstName: "Anna",
      lastName: "Lim",
      chair: "Chair 2",
      instructor: "Dr. Reyes",
      procedure: "Dental Filling",
      date: "2024-05-17",
    },
    {
      id: "A2024-004",
      firstName: "Mark",
      lastName: "Aquino",
      chair: "Chair 5",
      instructor: "Dr. Garcia",
      procedure: "Root Canal",
      date: "2024-05-18",
    },
    {
      id: "A2024-005",
      firstName: "Sarah",
      lastName: "Garcia",
      chair: "Chair 4",
      instructor: "Dr. Santos",
      procedure: "Dental Cleaning",
      date: "2024-05-19",
    },
  ]

  // Function to handle export
  const handleExport = (format) => {
    console.log(`Exporting in ${format} format...`)
    // Implementation for export functionality would go here
  }

  // Function to handle year change
  const handleStartYearChange = (e) => {
    const startYear = Number.parseInt(e.target.value)
    setNewAcademicYear({
      ...newAcademicYear,
      startYear,
      endYear: startYear + 1,
    })
  }

  // Function to handle edit year change
  const handleEditStartYearChange = (e) => {
    if (!selectedAcademicYear) return

    const startYear = Number.parseInt(e.target.value)
    setSelectedAcademicYear({
      ...selectedAcademicYear,
      academicYear: `${startYear}-${startYear + 1}`,
    })
  }

  return (
    <DashboardLayout>
      <Tabs defaultValue="academic-year" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="academic-year">Academic Year Management</TabsTrigger>
          <TabsTrigger value="clinician-history">Clinician History</TabsTrigger>
          <TabsTrigger value="activity-history">Activity History</TabsTrigger>
        </TabsList>

        {/* Academic Year Management Tab */}
        <TabsContent value="academic-year">
          <Card className="bg-white border border-gray-200 shadow-sm mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-[#333]">Academic Year Management</CardTitle>
              <Button
                className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none h-9 px-4 flex items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" /> Add Academic Year
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white border-b border-gray-200">
                  <TableRow className="hover:bg-white border-b-0">
                    <TableHead className="font-medium text-[#333]">ID</TableHead>
                    <TableHead className="font-medium text-[#333]">Academic Year</TableHead>
                    <TableHead className="font-medium text-[#333]">Semester</TableHead>
                    <TableHead className="font-medium text-[#333]">Status</TableHead>
                    <TableHead className="font-medium text-[#333]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.map((year) => (
                    <TableRow key={year.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="font-medium text-[#333]">{year.id}</TableCell>
                      <TableCell className="text-[#333]">{year.academicYear}</TableCell>
                      <TableCell className="text-[#333]">{year.semester} Semester</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            year.status === "Active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {year.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            className="h-8 w-8 text-white bg-[#5C8E77] hover:bg-[#406E58] flex items-center justify-center"
                            onClick={() => {
                              setSelectedAcademicYear(year)
                              setShowEditModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinician History Tab */}
        <TabsContent value="clinician-history">
          {/* Filters */}
          <div className="mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-[#333]">Report Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="academic-year" className="text-sm font-medium text-[#333]">
                      Academic Year
                    </label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger id="academic-year" className="border-gray-300">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">AY 2024-2025</SelectItem>
                        <SelectItem value="2023-2024">AY 2023-2024</SelectItem>
                        <SelectItem value="2022-2023">AY 2022-2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="semester" className="text-sm font-medium text-[#333]">
                      Semester
                    </label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger id="semester" className="border-gray-300">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st Semester</SelectItem>
                        <SelectItem value="2nd">2nd Semester</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clinician History Table */}
          <Card className="bg-white border border-gray-200 shadow-sm mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-[#333]">
                Clinician History - AY {selectedYear}, {selectedSemester} Semester
              </CardTitle>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
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
                    <TableHead className="font-medium text-[#333]">Sex</TableHead>
                    <TableHead className="font-medium text-[#333]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicianHistory.map((clinician) => (
                    <TableRow key={clinician.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="font-medium text-[#333]">{clinician.id}</TableCell>
                      <TableCell className="text-[#333]">{clinician.firstName}</TableCell>
                      <TableCell className="text-[#333]">{clinician.lastName}</TableCell>
                      <TableCell className="text-[#333]">{clinician.yearLevel}</TableCell>
                      <TableCell className="text-[#333]">{clinician.section}</TableCell>
                      <TableCell className="text-[#333]">{clinician.gender}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            clinician.status === "Enrolled"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {clinician.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity-history">
          {/* Filters */}
          <div className="mb-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-[#333]">Report Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="academic-year-activity" className="text-sm font-medium text-[#333]">
                      Academic Year
                    </label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger id="academic-year-activity" className="border-gray-300">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-2025">AY 2024-2025</SelectItem>
                        <SelectItem value="2023-2024">AY 2023-2024</SelectItem>
                        <SelectItem value="2022-2023">AY 2022-2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="semester-activity" className="text-sm font-medium text-[#333]">
                      Semester
                    </label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger id="semester-activity" className="border-gray-300">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st Semester</SelectItem>
                        <SelectItem value="2nd">2nd Semester</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity History Table */}
          <Card className="bg-white border border-gray-200 shadow-sm mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-[#333]">
                Activity History - AY {selectedYear}, {selectedSemester} Semester
              </CardTitle>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white border-b border-gray-200">
                  <TableRow className="hover:bg-white border-b-0">
                    <TableHead className="font-medium text-[#333]">Activity ID</TableHead>
                    <TableHead className="font-medium text-[#333]">First Name</TableHead>
                    <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                    <TableHead className="font-medium text-[#333]">Chair</TableHead>
                    <TableHead className="font-medium text-[#333]">Instructor</TableHead>
                    <TableHead className="font-medium text-[#333]">Procedure</TableHead>
                    <TableHead className="font-medium text-[#333]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityHistory.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="font-medium text-[#333]">{activity.id}</TableCell>
                      <TableCell className="text-[#333]">{activity.firstName}</TableCell>
                      <TableCell className="text-[#333]">{activity.lastName}</TableCell>
                      <TableCell className="text-[#333]">{activity.chair}</TableCell>
                      <TableCell className="text-[#333]">{activity.instructor}</TableCell>
                      <TableCell className="text-[#333]">{activity.procedure}</TableCell>
                      <TableCell className="text-[#333]">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Academic Year Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#5C8E77]">Add Academic Year</h2>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="new-academic-year" className="text-sm font-medium text-[#333]">
                    Academic Year Start
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="new-academic-year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={newAcademicYear.startYear}
                      onChange={handleStartYearChange}
                      className="border-gray-300"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      value={newAcademicYear.endYear}
                      readOnly
                      className="border-gray-300 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The academic year will be {newAcademicYear.startYear}-{newAcademicYear.endYear}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-semester" className="text-sm font-medium text-[#333]">
                    Semester
                  </label>
                  <Select
                    value={newAcademicYear.semester}
                    onValueChange={(value) => setNewAcademicYear({ ...newAcademicYear, semester: value })}
                  >
                    <SelectTrigger id="new-semester" className="border-gray-300">
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Semester</SelectItem>
                      <SelectItem value="2nd">2nd Semester</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-gray-300">
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                    onClick={() => {
                      console.log(
                        "Adding new academic year:",
                        `${newAcademicYear.startYear}-${newAcademicYear.endYear}`,
                        newAcademicYear.semester,
                      )
                      // Implementation for adding academic year would go here
                      setShowAddModal(false)
                    }}
                  >
                    Add Academic Year
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {showEditModal && selectedAcademicYear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#5C8E77]">Edit Academic Year</h2>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowEditModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="edit-academic-year" className="text-sm font-medium text-[#333]">
                    Academic Year Start
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-academic-year"
                      type="number"
                      min="2000"
                      max="2100"
                      defaultValue={Number.parseInt(selectedAcademicYear.academicYear.split("-")[0])}
                      onChange={handleEditStartYearChange}
                      className="border-gray-300"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      value={Number.parseInt(selectedAcademicYear.academicYear.split("-")[0]) + 1}
                      readOnly
                      className="border-gray-300 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The academic year will be {selectedAcademicYear.academicYear}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-semester" className="text-sm font-medium text-[#333]">
                    Semester
                  </label>
                  <Select defaultValue={selectedAcademicYear.semester}>
                    <SelectTrigger id="edit-semester" className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Semester</SelectItem>
                      <SelectItem value="2nd">2nd Semester</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-status" className="text-sm font-medium text-[#333]">
                    Status
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {selectedAcademicYear.status === "Active" ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      id="edit-status"
                      checked={selectedAcademicYear.status === "Active"}
                      onCheckedChange={(checked) => {
                        console.log(`Setting status to ${checked ? "Active" : "Inactive"}`)
                        // Implementation for toggling status would go here
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-gray-300">
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                    onClick={() => {
                      console.log("Updating academic year:", selectedAcademicYear.id)
                      // Implementation for updating academic year would go here
                      setShowEditModal(false)
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
