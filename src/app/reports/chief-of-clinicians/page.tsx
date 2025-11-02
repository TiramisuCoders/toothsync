//app/reports/chief-of-clinicians/page.tsx
"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Edit,
  Plus,
  FileText,
  FileSpreadsheet,
  Search,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
  clinicianId: string // student_id from clinician_records
  firstName: string
  lastName: string
  year: string // year_level from clinician_records
  section: string
  sex: string // sex from users table
  academicYearId: string
  createdAt: string
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
  grade?: string // Added grade property
}

interface NewAcademicYear {
  startYear: number
  endYear: number
  semester: string
  status: "Active" | "Inactive"
}

// Pagination state and types
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedSemester, setSelectedSemester] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [academicYearPage, setAcademicYearPage] = useState(1)
  const [activityHistoryPage, setActivityHistoryPage] = useState(1)
  const [academicYearPagination, setAcademicYearPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [activityHistoryPagination, setActivityHistoryPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

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
    status: "Inactive", // Changed default status to Inactive to match reference
  })

  const [formErrors, setFormErrors] = useState<{
    startYear?: string
    semester?: string
    general?: string
  }>({})

  // Fetching data from API
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAcademicYears()
  }, [academicYearPage]) // Added page dependency

  const fetchAcademicYears = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: academicYearPage.toString(),
        limit: "10",
      })
      const response = await fetch(`/api/academic-years?${params}`)

      if (response.ok) {
        const result = await response.json()

        if (result.data) {
          setAcademicYears(result.data)
          setAcademicYearPagination(result.pagination)
        } else {
          // Fallback for non-paginated response
          setAcademicYears(result)
        }
      } else {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
        console.error("Failed to fetch academic years")
        toast({
          title: "Error",
          description: "Failed to load academic years. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Network/Parse Error:", error)
      console.error("Error fetching academic years:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching academic years.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const [clinicianHistory, setClinicianHistory] = useState<Clinician[]>([])
  const [isLoadingClinicians, setIsLoadingClinicians] = useState(false)
  const [clinicianPagination, setClinicianPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [clinicianPage, setClinicianPage] = useState(1)

  const fetchClinicianHistory = async () => {
    setIsLoadingClinicians(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear !== "all") {
        // Find the academic year ID from the selected year
        const selectedAcademicYear = academicYears.find((ay) => ay.academicYear === selectedYear)
        if (selectedAcademicYear) {
          params.append("academicYear", selectedAcademicYear.id)
        }
      }
      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      params.append("page", clinicianPage.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/clinician-records?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch clinician records")
      }

      const result = await response.json()

      setClinicianHistory(result.data || [])
      if (result.pagination) {
        setClinicianPagination(result.pagination)
      }
    } catch (error) {
      console.error("Error fetching clinician records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clinician history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingClinicians(false)
    }
  }

  useEffect(() => {
    fetchClinicianHistory()
  }, [selectedYear, searchTerm, clinicianPage]) // Removed selectedSemester dependency

  const [activityHistory, setActivityHistory] = useState<Activity[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  const fetchActivityHistory = async () => {
    setIsLoadingActivity(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear !== "all") params.append("academicYear", selectedYear)
      if (selectedSemester !== "all") params.append("semester", selectedSemester)
      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      params.append("page", activityHistoryPage.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/activity-history?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch activity history")
      }
      const result = await response.json()
      setActivityHistory(result.data || [])
      if (result.pagination) {
        setActivityHistoryPagination(result.pagination)
      }
    } catch (error) {
      console.error("Error fetching activity history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch activity history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingActivity(false)
    }
  }

  useEffect(() => {
    fetchActivityHistory()
  }, [selectedYear, selectedSemester, searchTerm, activityHistoryPage]) // Added page dependency

  const filteredClinicianHistory = useMemo(() => {
    return clinicianHistory
  }, [clinicianHistory])

  const filteredActivityHistory = useMemo(() => {
    return activityHistory
  }, [activityHistory])

  const academicYearOptions = useMemo(() => {
    const years = academicYears.map((ay) => ay.academicYear)
    return [...new Set(years)].sort().reverse()
  }, [academicYears])

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
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          const htmlContent = generatePDFContent(data, filename)
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          printWindow.print()
          toast({
            title: "PDF Export",
            description: "PDF print dialog opened. Please save or print the document.",
          })
        }
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

  const generatePDFContent = (data: any[], title: string): string => {
    const headers = Object.keys(data[0] || {})
    const rows = data.map((row) => headers.map((header) => String(row[header] || "")).join("</td><td>"))

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #059669; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${title.replace(/-/g, " ").toUpperCase()}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr><th>${headers.join("</th><th>")}</th></tr>
            </thead>
            <tbody>
              <tr><td>${rows.join("</td></tr><tr><td>")}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `
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

  const handleConfirmAddAcademicYear = async () => {
  try {
    setIsLoading(true)
    
    const response = await fetch("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startYear: newAcademicYear.startYear,
        endYear: newAcademicYear.endYear,
        semester: newAcademicYear.semester,
        status: newAcademicYear.status,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create academic year")
    }

    toast({
      title: "Academic Year Added",
      description: `AY ${newAcademicYear.startYear}-${newAcademicYear.endYear} has been added successfully.`,
    })

    setShowAddConfirmModal(false)
    setShowAddModal(false)
    setNewAcademicYear({
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
      semester: "1st",
      status: "Inactive",
    })
    
    await fetchAcademicYears() // Refresh list

  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}

  const handleUpdateAcademicYearClick = () => {
    if (selectedAcademicYear) {
      setShowEditConfirmModal(true)
    }
  }

  const handleConfirmUpdateAcademicYear = async () => {
    if (!selectedAcademicYear) return

    try {
      const response = await fetch("/api/academic-years", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedAcademicYear.id,
          academic_year: selectedAcademicYear.academicYear,
          semester: selectedAcademicYear.semester.toLowerCase(),
          status: selectedAcademicYear.status.toLowerCase(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update academic year")
      }

      await fetchAcademicYears()

      toast({
        title: "Academic Year Updated",
        description: `${selectedAcademicYear.academicYear} (${selectedAcademicYear.semester} semester) has been updated successfully.`,
      })

      setShowEditConfirmModal(false)
      setShowEditModal(false)
      setSelectedAcademicYear(null)
    } catch (error) {
      console.error("Error updating academic year:", error)
      toast({
        title: "Error",
        description: "Failed to update academic year. Please try again.",
        variant: "destructive",
      })
    }
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

  const handleStatusChange = async (id: string, newStatus: "Active" | "Inactive") => {
    try {
      const response = await fetch("/api/academic-years", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (response.ok) {
        const updatedYear = await response.json()
        setAcademicYears((prev) => prev.map((year) => (year.id === id ? updatedYear : year)))
        toast({
          title: "Status Updated",
          description: `Academic year status updated to ${newStatus}.`,
        })
      } else {
        console.error("Failed to update academic year status")
        toast({
          title: "Error",
          description: "Failed to update academic year status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating academic year status:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating the status.",
        variant: "destructive",
      })
    }
  }

  const filteredAcademicYears = useMemo(() => {
    return academicYears.filter((year) => {
      const matchesSearch =
        searchTerm === "" ||
        year.academicYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
        year.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
        year.id.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [academicYears, searchTerm])

  const PaginationControls = ({
    pagination,
    onPageChange,
  }: {
    pagination: Pagination
    onPageChange: (page: number) => void
  }) => {
    if (pagination.totalPages <= 1) return null

    const pages = []
    // Display up to 5 pages, centered around the current page if possible
    const startPage = Math.max(1, pagination.page - 2)
    const endPage = Math.min(pagination.totalPages, pagination.page + 2)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === pagination.page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={page === pagination.page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="flex items-center gap-1"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
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
                {loading ? (
                  <div className="flex justify-center items-center py-12">Loading...</div>
                ) : (
                  <>
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
                                        <Label
                                          htmlFor="edit-academic-year"
                                          className="text-sm font-medium text-gray-900"
                                        >
                                          Academic Year Start
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            id="edit-academic-year"
                                            type="number"
                                            min="2000"
                                            max="2100"
                                            defaultValue={Number.parseInt(
                                              selectedAcademicYear.academicYear.split("-")[0],
                                            )}
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
                                        {/* Fix semester selection to update the selectedAcademicYear state */}
                                        <Select
                                          defaultValue={selectedAcademicYear.semester}
                                          onValueChange={(value) => {
                                            setSelectedAcademicYear({
                                              ...selectedAcademicYear,
                                              semester: value,
                                            })
                                          }}
                                        >
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
                    <PaginationControls
                      pagination={academicYearPagination}
                      onPageChange={(page) => setAcademicYearPage(page)}
                    />
                  </>
                )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academic-year" className="text-sm font-medium text-gray-900">
                        Academic Year
                      </Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="academic-year" className="border-gray-300">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Academic Years</SelectItem>
                          {academicYearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              AY {year}
                            </SelectItem>
                          ))}
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
                    Clinician History
                    {selectedYear !== "all" ? (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        - {selectedYear !== "all" ? `AY ${selectedYear}` : "All Years"}
                      </span>
                    ) : null}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {isLoadingClinicians ? "Loading..." : `Showing ${filteredClinicianHistory.length} records`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-2"
                    onClick={() =>
                      handleExport(
                        "csv",
                        filteredClinicianHistory.map((c) => ({
                          "Clinician ID": c.clinicianId,
                          "First Name": c.firstName,
                          "Last Name": c.lastName,
                          Year: c.year,
                          Section: c.section,
                          Sex: c.sex,
                        })),
                        `clinician-history-${selectedYear}`,
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
                        filteredClinicianHistory.map((c) => ({
                          "Clinician ID": c.clinicianId,
                          "First Name": c.firstName,
                          "Last Name": c.lastName,
                          Year: c.year,
                          Section: c.section,
                          Sex: c.sex,
                        })),
                        `clinician-history-${selectedYear}`,
                      )
                    }
                    disabled={isLoading || filteredClinicianHistory.length === 0}
                  >
                    <FileText className="h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingClinicians ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-lg font-medium">Loading clinician history...</p>
                  </div>
                ) : filteredClinicianHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader className="bg-white border-b border-gray-200">
                        <TableRow className="hover:bg-white border-b-0">
                          <TableHead className="font-medium text-gray-900">Clinician ID</TableHead>
                          <TableHead className="font-medium text-gray-900">First Name</TableHead>
                          <TableHead className="font-medium text-gray-900">Last Name</TableHead>
                          <TableHead className="font-medium text-gray-900">Year</TableHead>
                          <TableHead className="font-medium text-gray-900">Section</TableHead>
                          <TableHead className="font-medium text-gray-900">Sex</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClinicianHistory.map((clinician) => (
                          <TableRow key={clinician.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <TableCell className="font-medium text-gray-900">{clinician.clinicianId}</TableCell>
                            <TableCell className="text-gray-900">{clinician.firstName}</TableCell>
                            <TableCell className="text-gray-900">{clinician.lastName}</TableCell>
                            <TableCell className="text-gray-900">{clinician.year}</TableCell>
                            <TableCell className="text-gray-900">{clinician.section}</TableCell>
                            <TableCell className="text-gray-900">{clinician.sex}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      pagination={clinicianPagination}
                      onPageChange={(page) => setClinicianPage(page)}
                    />
                  </>
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
                          <SelectItem value="all">All Academic Years</SelectItem>
                          {academicYearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              AY {year}
                            </SelectItem>
                          ))}
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
                          <SelectItem value="all">All Semesters</SelectItem>
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
                    Activity History
                    {selectedYear !== "all" || selectedSemester !== "all" ? (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        - {selectedYear !== "all" ? `AY ${selectedYear}` : "All Years"}
                        {selectedSemester !== "all" ? `, ${selectedSemester} Semester` : ", All Semesters"}
                      </span>
                    ) : null}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {isLoadingActivity ? "Loading..." : `Showing ${filteredActivityHistory.length} records`}
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
                {isLoadingActivity ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-lg font-medium">Loading activity history...</p>
                  </div>
                ) : activityHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader className="bg-white border-b border-gray-200">
                        <TableRow className="hover:bg-white border-b-0">
                          <TableHead className="font-medium text-gray-900">Activity ID</TableHead>
                          <TableHead className="font-medium text-gray-900">First Name</TableHead>
                          <TableHead className="font-medium text-gray-900">Last Name</TableHead>
                          <TableHead className="font-medium text-gray-900">Chair</TableHead>
                          <TableHead className="font-medium text-gray-900">Instructor</TableHead>
                          <TableHead className="font-medium text-gray-900">Procedure</TableHead>
                          <TableHead className="font-medium text-gray-900">Grade</TableHead>
                          <TableHead className="font-medium text-gray-900">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityHistory.map((activity) => (
                          <TableRow key={activity.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <TableCell className="font-medium text-gray-900">{activity.id}</TableCell>
                            <TableCell className="text-gray-900">{activity.firstName}</TableCell>
                            <TableCell className="text-gray-900">{activity.lastName}</TableCell>
                            <TableCell className="text-gray-900">{activity.chair}</TableCell>
                            <TableCell className="text-gray-900">{activity.instructor}</TableCell>
                            <TableCell className="text-gray-900">{activity.procedure}</TableCell>
                            <TableCell className="text-gray-900">{activity.grade}</TableCell>
                            <TableCell className="text-gray-900">
                              {new Date(activity.date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      pagination={activityHistoryPagination}
                      onPageChange={(page) => setActivityHistoryPage(page)}
                    />
                  </>
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
