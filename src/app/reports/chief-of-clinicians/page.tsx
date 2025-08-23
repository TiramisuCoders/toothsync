"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Edit, Plus, FileText, FileSpreadsheet, Search, AlertCircle, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription } from "@/components/ui/alert"

// TypeScript interfaces for better type safety
interface AcademicYear {
  id: string
  academicYear: string
  semester: string
  status: "Active" | "Inactive"
  createdAt: string
}

interface Clinician {
  id: string
  firstName: string
  lastName: string
  yearLevel: string
  section: string
  gender: string
  status: "Enrolled" | "Not Enrolled"
  academicYear: string
  semester: string
}

interface Activity {
  id: string
  firstName: string
  lastName: string
  chair: string
  instructor: string
  procedure: string
  date: string
  academicYear: string
  semester: string
}

interface NewAcademicYear {
  startYear: number
  endYear: number
  semester: string
  status: "Active" | "Inactive"
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState("2024-2025")
  const [selectedSemester, setSelectedSemester] = useState("1st")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null)
  const [newAcademicYear, setNewAcademicYear] = useState<NewAcademicYear>({
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    semester: "1st",
    status: "Inactive",
  })

  const [formErrors, setFormErrors] = useState<{
    startYear?: string
    semester?: string
    general?: string
  }>({})

  const academicYears: AcademicYear[] = [
    {
      id: "AY2024-001",
      academicYear: "2024-2025",
      semester: "1st",
      status: "Active",
      createdAt: "2024-08-01",
    },
    {
      id: "AY2023-002",
      academicYear: "2023-2024",
      semester: "2nd",
      status: "Inactive",
      createdAt: "2024-01-15",
    },
    {
      id: "AY2023-001",
      academicYear: "2023-2024",
      semester: "1st",
      status: "Inactive",
      createdAt: "2023-08-01",
    },
    {
      id: "AY2022-002",
      academicYear: "2022-2023",
      semester: "2nd",
      status: "Inactive",
      createdAt: "2023-01-15",
    },
    {
      id: "AY2022-001",
      academicYear: "2022-2023",
      semester: "1st",
      status: "Inactive",
      createdAt: "2022-08-01",
    },
  ]

  const clinicianHistory: Clinician[] = [
    {
      id: "C2024-001",
      firstName: "Maria",
      lastName: "Santos",
      yearLevel: "3rd Year",
      section: "A",
      gender: "Female",
      status: "Enrolled",
      academicYear: "2024-2025",
      semester: "1st",
    },
    {
      id: "C2024-002",
      firstName: "John",
      lastName: "Dela Cruz",
      yearLevel: "4th Year",
      section: "B",
      gender: "Male",
      status: "Enrolled",
      academicYear: "2024-2025",
      semester: "1st",
    },
    {
      id: "C2024-003",
      firstName: "Anna",
      lastName: "Lim",
      yearLevel: "3rd Year",
      section: "A",
      gender: "Female",
      status: "Not Enrolled",
      academicYear: "2023-2024",
      semester: "2nd",
    },
    {
      id: "C2024-004",
      firstName: "Mark",
      lastName: "Aquino",
      yearLevel: "4th Year",
      section: "C",
      gender: "Male",
      status: "Enrolled",
      academicYear: "2024-2025",
      semester: "1st",
    },
  ]

  const activityHistory: Activity[] = [
    {
      id: "A2024-001",
      firstName: "Maria",
      lastName: "Santos",
      chair: "Chair 1",
      instructor: "Dr. Reyes",
      procedure: "Dental Cleaning",
      date: "2024-05-15",
      academicYear: "2024-2025",
      semester: "1st",
    },
    {
      id: "A2024-002",
      firstName: "John",
      lastName: "Dela Cruz",
      chair: "Chair 3",
      instructor: "Dr. Santos",
      procedure: "Tooth Extraction",
      date: "2024-05-16",
      academicYear: "2024-2025",
      semester: "1st",
    },
    {
      id: "A2024-003",
      firstName: "Anna",
      lastName: "Lim",
      chair: "Chair 2",
      instructor: "Dr. Reyes",
      procedure: "Dental Filling",
      date: "2024-05-17",
      academicYear: "2023-2024",
      semester: "2nd",
    },
    {
      id: "A2024-004",
      firstName: "Mark",
      lastName: "Aquino",
      chair: "Chair 5",
      instructor: "Dr. Garcia",
      procedure: "Root Canal",
      date: "2024-05-18",
      academicYear: "2024-2025",
      semester: "1st",
    },
    {
      id: "A2024-005",
      firstName: "Sarah",
      lastName: "Garcia",
      chair: "Chair 4",
      instructor: "Dr. Santos",
      procedure: "Dental Cleaning",
      date: "2024-05-19",
      academicYear: "2024-2025",
      semester: "1st",
    },
  ]

  const filteredClinicianHistory = useMemo(() => {
    return clinicianHistory.filter((clinician) => {
      const matchesYear = clinician.academicYear === selectedYear
      const matchesSemester = clinician.semester === selectedSemester
      const matchesSearch =
        searchTerm === "" ||
        clinician.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinician.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinician.id.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesYear && matchesSemester && matchesSearch
    })
  }, [selectedYear, selectedSemester, searchTerm])

  const filteredActivityHistory = useMemo(() => {
    return activityHistory.filter((activity) => {
      const matchesYear = activity.academicYear === selectedYear
      const matchesSemester = activity.semester === selectedSemester
      const matchesSearch =
        searchTerm === "" ||
        activity.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.instructor.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesYear && matchesSemester && matchesSearch
    })
  }, [selectedYear, selectedSemester, searchTerm])

  const handleExport = async (format: "csv" | "pdf", data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please ensure there are records to export.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (format === "csv") {
        const csvContent = convertToCSV(data)
        downloadFile(csvContent, `${filename}.csv`, "text/csv")
        toast({
          title: "Export Successful",
          description: `${filename}.csv has been downloaded successfully.`,
        })
      } else if (format === "pdf") {
        // Enhanced PDF export placeholder with better user feedback
        toast({
          title: "PDF Export Coming Soon",
          description: "PDF export functionality will be available in the next update.",
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((value) => {
            // Better CSV escaping for special characters
            const stringValue = String(value || "")
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(","),
      )
      .join("\n")

    return `${headers}\n${rows}`
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const validateNewAcademicYear = (): boolean => {
    const errors: typeof formErrors = {}

    // Validate start year
    if (newAcademicYear.startYear < 2000 || newAcademicYear.startYear > 2100) {
      errors.startYear = "Start year must be between 2000 and 2100"
    }

    // Check for duplicate academic year and semester combination
    const duplicate = academicYears.find(
      (year) =>
        year.academicYear === `${newAcademicYear.startYear}-${newAcademicYear.endYear}` &&
        year.semester === newAcademicYear.semester,
    )

    if (duplicate) {
      errors.general = `Academic Year ${newAcademicYear.startYear}-${newAcademicYear.endYear} for ${newAcademicYear.semester} semester already exists.`
    }

    // Validate semester
    if (!newAcademicYear.semester) {
      errors.semester = "Please select a semester"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStartYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startYear = Number.parseInt(e.target.value)
    if (!isNaN(startYear)) {
      setNewAcademicYear({
        ...newAcademicYear,
        startYear,
        endYear: startYear + 1,
      })
      if (formErrors.startYear) {
        setFormErrors({ ...formErrors, startYear: undefined })
      }
    }
  }

  const handleEditStartYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAcademicYear) return

    const startYear = Number.parseInt(e.target.value)
    if (!isNaN(startYear) && startYear >= 2000 && startYear <= 2100) {
      setSelectedAcademicYear({
        ...selectedAcademicYear,
        academicYear: `${startYear}-${startYear + 1}`,
      })
    }
  }

  const handleAddAcademicYearClick = () => {
    if (validateNewAcademicYear()) {
      setShowAddConfirmModal(true)
    }
  }

  const handleConfirmAddAcademicYear = () => {
    const newId = `AY${newAcademicYear.startYear}-${String(academicYears.length + 1).padStart(3, "0")}`

    // In a real application, this would make an API call
    console.log("Adding new academic year:", {
      id: newId,
      academicYear: `${newAcademicYear.startYear}-${newAcademicYear.endYear}`,
      semester: newAcademicYear.semester,
      status: newAcademicYear.status,
    })

    toast({
      title: "Academic Year Added",
      description: `AY ${newAcademicYear.startYear}-${newAcademicYear.endYear} (${newAcademicYear.semester} semester) has been added successfully.`,
    })

    setShowAddConfirmModal(false)
    setShowAddModal(false)
    setFormErrors({})
    setNewAcademicYear({
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
      semester: "1st",
      status: "Inactive",
    })
  }

  const handleUpdateAcademicYearClick = () => {
    if (selectedAcademicYear) {
      setShowEditConfirmModal(true)
    }
  }

  const handleConfirmUpdateAcademicYear = () => {
    if (!selectedAcademicYear) return

    // In a real application, this would make an API call
    console.log("Updating academic year:", selectedAcademicYear.id, selectedAcademicYear)

    toast({
      title: "Academic Year Updated",
      description: `${selectedAcademicYear.academicYear} (${selectedAcademicYear.semester} semester) has been updated successfully.`,
    })

    setShowEditConfirmModal(false)
    setShowEditModal(false)
    setSelectedAcademicYear(null)
  }

  const handleAddAcademicYear = () => {
    // Check for duplicate academic year and semester combination
    const duplicate = academicYears.find(
      (year) =>
        year.academicYear === `${newAcademicYear.startYear}-${newAcademicYear.endYear}` &&
        year.semester === newAcademicYear.semester,
    )

    if (duplicate) {
      toast({
        title: "Duplicate Entry",
        description: `Academic Year ${newAcademicYear.startYear}-${newAcademicYear.endYear} for ${newAcademicYear.semester} semester already exists.`,
        variant: "destructive",
      })
      return
    }

    const newId = `AY${newAcademicYear.startYear}-${String(academicYears.length + 1).padStart(3, "0")}`

    // In a real application, this would make an API call
    console.log("Adding new academic year:", {
      id: newId,
      academicYear: `${newAcademicYear.startYear}-${newAcademicYear.endYear}`,
      semester: newAcademicYear.semester,
      status: newAcademicYear.status,
    })

    toast({
      title: "Academic Year Added",
      description: `AY ${newAcademicYear.startYear}-${newAcademicYear.endYear} (${newAcademicYear.semester} semester) has been added successfully.`,
    })

    setShowAddModal(false)
    setNewAcademicYear({
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
      semester: "1st",
      status: "Inactive",
    })
  }

  const handleUpdateAcademicYear = () => {
    if (!selectedAcademicYear) return

    // In a real application, this would make an API call
    console.log("Updating academic year:", selectedAcademicYear.id, selectedAcademicYear)

    toast({
      title: "Academic Year Updated",
      description: `${selectedAcademicYear.academicYear} (${selectedAcademicYear.semester} semester) has been updated successfully.`,
    })

    setShowEditModal(false)
    setSelectedAcademicYear(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Reports</h1>
          <p className="text-gray-600">
            Manage academic years and generate comprehensive reports for dental clinic operations
          </p>
        </div>

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
                <CardTitle className="text-xl font-semibold text-gray-900">Academic Year Management</CardTitle>
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-none h-9 px-4 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Academic Year
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-emerald-600">Add Academic Year</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {formErrors.general && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{formErrors.general}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="new-academic-year" className="text-sm font-medium text-gray-900">
                          Academic Year Start
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              id="new-academic-year"
                              type="number"
                              min="2000"
                              max="2100"
                              value={newAcademicYear.startYear}
                              onChange={handleStartYearChange}
                              className={`border-gray-300 ${formErrors.startYear ? "border-red-500 focus:border-red-500" : ""}`}
                              aria-describedby="year-help"
                            />
                            {formErrors.startYear && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.startYear}</p>
                            )}
                          </div>
                          <span className="text-gray-500">-</span>
                          <Input
                            type="number"
                            value={newAcademicYear.endYear}
                            readOnly
                            className="border-gray-300 bg-gray-50 flex-1"
                            tabIndex={-1}
                          />
                        </div>
                        <p id="year-help" className="text-xs text-gray-500 mt-1">
                          The academic year will be {newAcademicYear.startYear}-{newAcademicYear.endYear}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-semester" className="text-sm font-medium text-gray-900">
                          Semester
                        </Label>
                        <Select
                          value={newAcademicYear.semester}
                          onValueChange={(value) => {
                            setNewAcademicYear({ ...newAcademicYear, semester: value })
                            if (formErrors.semester) {
                              setFormErrors({ ...formErrors, semester: undefined })
                            }
                          }}
                        >
                          <SelectTrigger
                            id="new-semester"
                            className={`border-gray-300 ${formErrors.semester ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select Semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st">1st Semester</SelectItem>
                            <SelectItem value="2nd">2nd Semester</SelectItem>
                            <SelectItem value="summer">Summer</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.semester && <p className="text-red-500 text-xs mt-1">{formErrors.semester}</p>}
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddModal(false)
                            setFormErrors({})
                          }}
                          className="border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={handleAddAcademicYearClick}
                        >
                          Add Academic Year
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white border-b border-gray-200">
                    <TableRow className="hover:bg-white border-b-0">
                      <TableHead className="font-medium text-gray-900">ID</TableHead>
                      <TableHead className="font-medium text-gray-900">Academic Year</TableHead>
                      <TableHead className="font-medium text-gray-900">Semester</TableHead>
                      <TableHead className="font-medium text-gray-900">Status</TableHead>
                      <TableHead className="font-medium text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears.map((year) => (
                      <TableRow key={year.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="font-medium text-gray-900">{year.id}</TableCell>
                        <TableCell className="text-gray-900">{year.academicYear}</TableCell>
                        <TableCell className="text-gray-900">{year.semester} Semester</TableCell>
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
                          <Dialog
                            open={showEditModal && selectedAcademicYear?.id === year.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setShowEditModal(false)
                                setSelectedAcademicYear(null)
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                className="h-8 w-8 text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center"
                                onClick={() => {
                                  setSelectedAcademicYear(year)
                                  setShowEditModal(true)
                                }}
                                aria-label={`Edit ${year.academicYear}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-semibold text-emerald-600">
                                  Edit Academic Year
                                </DialogTitle>
                              </DialogHeader>
                              {selectedAcademicYear && (
                                <div className="space-y-6">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-academic-year" className="text-sm font-medium text-gray-900">
                                      Academic Year Start
                                    </Label>
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
                                        tabIndex={-1}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      The academic year will be {selectedAcademicYear.academicYear}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-semester" className="text-sm font-medium text-gray-900">
                                      Semester
                                    </Label>
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
                                    <Label htmlFor="edit-status" className="text-sm font-medium text-gray-900">
                                      Status
                                    </Label>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-500">
                                        {selectedAcademicYear.status === "Active" ? "Active" : "Inactive"}
                                      </span>
                                      <Switch
                                        id="edit-status"
                                        checked={selectedAcademicYear.status === "Active"}
                                        onCheckedChange={(checked) => {
                                          setSelectedAcademicYear({
                                            ...selectedAcademicYear,
                                            status: checked ? "Active" : "Inactive",
                                          })
                                        }}
                                        aria-label="Toggle academic year status"
                                      />
                                    </div>
                                  </div>
                                  <div className="pt-4 flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setShowEditModal(false)}
                                      className="border-gray-300"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                      onClick={handleUpdateAcademicYearClick}
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showAddConfirmModal} onOpenChange={setShowAddConfirmModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-emerald-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Add Academic Year
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-700">Are you sure you want to add the following academic year?</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Academic Year:</strong> {newAcademicYear.startYear}-{newAcademicYear.endYear}
                    </p>
                    <p>
                      <strong>Semester:</strong> {newAcademicYear.semester} Semester
                    </p>
                    <p>
                      <strong>Status:</strong> {newAcademicYear.status}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddConfirmModal(false)} className="border-gray-300">
                      Cancel
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleConfirmAddAcademicYear}
                    >
                      Confirm Add
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditConfirmModal} onOpenChange={setShowEditConfirmModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-emerald-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Edit Academic Year
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-700">Are you sure you want to save the changes to this academic year?</p>
                  {selectedAcademicYear && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <strong>Academic Year:</strong> {selectedAcademicYear.academicYear}
                      </p>
                      <p>
                        <strong>Semester:</strong> {selectedAcademicYear.semester} Semester
                      </p>
                      <p>
                        <strong>Status:</strong> {selectedAcademicYear.status}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditConfirmModal(false)}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleConfirmUpdateAcademicYear}
                    >
                      Confirm Update
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Clinician History Tab */}
          <TabsContent value="clinician-history">
            <div className="mb-6">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900">Report Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic-year" className="text-sm font-medium text-gray-900">
                        Academic Year
                      </Label>
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
                      <Label htmlFor="semester" className="text-sm font-medium text-gray-900">
                        Semester
                      </Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="search" className="text-sm font-medium text-gray-900">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="search"
                          type="text"
                          placeholder="Search by name or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clinician History Table */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Clinician History - AY {selectedYear}, {selectedSemester} Semester
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {filteredClinicianHistory.length} of {clinicianHistory.length} records
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-2"
                    onClick={() =>
                      handleExport(
                        "csv",
                        filteredClinicianHistory,
                        `clinician-history-${selectedYear}-${selectedSemester}`,
                      )
                    }
                    disabled={isLoading || filteredClinicianHistory.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 bg-transparent"
                    onClick={() =>
                      handleExport(
                        "pdf",
                        filteredClinicianHistory,
                        `clinician-history-${selectedYear}-${selectedSemester}`,
                      )
                    }
                    disabled={isLoading || filteredClinicianHistory.length === 0}
                  >
                    <FileText className="h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredClinicianHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white border-b border-gray-200">
                      <TableRow className="hover:bg-white border-b-0">
                        <TableHead className="font-medium text-gray-900">Clinician ID</TableHead>
                        <TableHead className="font-medium text-gray-900">First Name</TableHead>
                        <TableHead className="font-medium text-gray-900">Last Name</TableHead>
                        <TableHead className="font-medium text-gray-900">Year</TableHead>
                        <TableHead className="font-medium text-gray-900">Section</TableHead>
                        <TableHead className="font-medium text-gray-900">Sex</TableHead>
                        <TableHead className="font-medium text-gray-900">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClinicianHistory.map((clinician) => (
                        <TableRow key={clinician.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <TableCell className="font-medium text-gray-900">{clinician.id}</TableCell>
                          <TableCell className="text-gray-900">{clinician.firstName}</TableCell>
                          <TableCell className="text-gray-900">{clinician.lastName}</TableCell>
                          <TableCell className="text-gray-900">{clinician.yearLevel}</TableCell>
                          <TableCell className="text-gray-900">{clinician.section}</TableCell>
                          <TableCell className="text-gray-900">{clinician.gender}</TableCell>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity History Tab */}
          <TabsContent value="activity-history">
            {/* Filters */}
            <div className="mb-6">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900">Report Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic-year-activity" className="text-sm font-medium text-gray-900">
                        Academic Year
                      </Label>
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
                      <Label htmlFor="semester-activity" className="text-sm font-medium text-gray-900">
                        Semester
                      </Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="search-activity" className="text-sm font-medium text-gray-900">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="search-activity"
                          type="text"
                          placeholder="Search by name, procedure, or instructor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity History Table */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Activity History - AY {selectedYear}, {selectedSemester} Semester
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {filteredActivityHistory.length} of {activityHistory.length} records
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-2"
                    onClick={() =>
                      handleExport(
                        "csv",
                        filteredActivityHistory,
                        `activity-history-${selectedYear}-${selectedSemester}`,
                      )
                    }
                    disabled={isLoading || filteredActivityHistory.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 bg-transparent"
                    onClick={() =>
                      handleExport(
                        "pdf",
                        filteredActivityHistory,
                        `activity-history-${selectedYear}-${selectedSemester}`,
                      )
                    }
                    disabled={isLoading || filteredActivityHistory.length === 0}
                  >
                    <FileText className="h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredActivityHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white border-b border-gray-200">
                      <TableRow className="hover:bg-white border-b-0">
                        <TableHead className="font-medium text-gray-900">Activity ID</TableHead>
                        <TableHead className="font-medium text-gray-900">First Name</TableHead>
                        <TableHead className="font-medium text-gray-900">Last Name</TableHead>
                        <TableHead className="font-medium text-gray-900">Chair</TableHead>
                        <TableHead className="font-medium text-gray-900">Instructor</TableHead>
                        <TableHead className="font-medium text-gray-900">Procedure</TableHead>
                        <TableHead className="font-medium text-gray-900">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivityHistory.map((activity) => (
                        <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <TableCell className="font-medium text-gray-900">{activity.id}</TableCell>
                          <TableCell className="text-gray-900">{activity.firstName}</TableCell>
                          <TableCell className="text-gray-900">{activity.lastName}</TableCell>
                          <TableCell className="text-gray-900">{activity.chair}</TableCell>
                          <TableCell className="text-gray-900">{activity.instructor}</TableCell>
                          <TableCell className="text-gray-900">{activity.procedure}</TableCell>
                          <TableCell className="text-gray-900">
                            {new Date(activity.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
