"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Plus, Edit, Upload, User, Eye, Search, X, ChevronRight, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { uploadCliniciansCsv } from "@/lib/csv-upload"

import { createBrowserClient } from "@supabase/ssr"

// Type definitions
interface Clinician {
  id: string
  studentId: string
  firstName: string
  lastName: string
  gender: string
  status: string
  email: string
  contactNumber: string
  yearLevel: string
}

interface AcademicYear {
  id: string
  academicYear: string
  semester: string
  status: string
  createdAt: string
}

interface AttendanceRecord {
  id: number
  date: string
  timeIn: string
  timeOut: string
  sanitized: string
  status: string
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
}

interface NewClinician {
  studentId: string
  firstName: string
  lastName: string
  gender: string
  email: string
  contactNumber: string
  yearLevel: string
  status: string
  academicYearId?: string
}

export default function CliniciansPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "enrolled" | "not-enrolled">("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentClinician, setCurrentClinician] = useState<Clinician | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null)
  // const [activeTab, setActiveTab] = useState<"activities" | "attendance">("activities")

  const [searchQuery, setSearchQuery] = useState("") // search state already exists
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
// Add these new state variables at the top of your component
const [clinicianActivities, setClinicianActivities] = useState<any>(null);
const [isLoadingActivities, setIsLoadingActivities] = useState(false);
const [activitiesError, setActivitiesError] = useState<string>("");
const [selectedAcademicYearTab, setSelectedAcademicYearTab] = useState<string>("");

  const [addSuccessMessage, setAddSuccessMessage] = useState<string>("")
  const [addErrorMessage, setAddErrorMessage] = useState<string>("")
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>("")
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [isLoadingAcademicYears, setIsLoadingAcademicYears] = useState(false)

  const [formData, setFormData] = useState<Partial<NewClinician>>({
    yearLevel: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [clinicians, setClinicians] = useState<Clinician[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    fetchClinicians()
    fetchAcademicYears()
  }, [])
  

  const fetchClinicians = async () => {
    try {
      const response = await fetch("/api/clinicians")
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to fetch clinicians:", response.status, errorData)
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || "Unknown error"}`)
      }
      const data: Clinician[] = await response.json()
      setClinicians(data)
    } catch (error) {
      console.error("Failed to fetch clinicians:", error)
    }
  }

  const fetchAcademicYears = async () => {
    setIsLoadingAcademicYears(true)
    try {
      const response = await fetch("/api/academic-years?limit=100")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setAcademicYears(result.data || [])
    } catch (error) {
      console.error("Failed to fetch academic years:", error)
    } finally {
      setIsLoadingAcademicYears(false)
    }
  }

  const fetchClinicianActivities = async (clinicianId: string) => {
  setIsLoadingActivities(true);
  setActivitiesError("");
  try {
    const response = await fetch('/api/clinicians/activity_overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clinician_id: clinicianId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      setClinicianActivities(result.data);
    } else {
      setClinicianActivities(null);
      setActivitiesError(result.message || 'No activities found for this clinician');
    }
  } catch (error) {
    console.error('Failed to fetch clinician activities:', error);
    setActivitiesError('Failed to load activities. Please try again.');
    setClinicianActivities(null);
  } finally {
    setIsLoadingActivities(false);
  }
};

  const handleEditClick = (clinician: Clinician) => {
    setCurrentClinician(clinician)
    setIsEditModalOpen(true)
  }

  const handleViewClick = (clinician: Clinician) => {
    setSelectedClinician(clinician);
    setIsViewModalOpen(true);
    // Fetch activities when modal opens
    fetchClinicianActivities(clinician.id);
  };
  const handleUpdateClinician = (updatedClinician: Clinician) => {
    setClinicians(clinicians.map((clinician) => (clinician.id === updatedClinician.id ? updatedClinician : clinician)))
    setIsEditModalOpen(false)
  }

  const updateFormData = (field: keyof NewClinician, value: string) => {
    setFormData((prev: Partial<NewClinician>) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      yearLevel: "",
      studentId: "",
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      contactNumber: "",
      status: "",
      academicYearId: "",
    })
    setFormErrors({})
    setAddSuccessMessage("")
    setAddErrorMessage("")
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.studentId?.trim()) errors.studentId = "Student ID is required"
    if (!formData.firstName?.trim()) errors.firstName = "First name is required"
    if (!formData.lastName?.trim()) errors.lastName = "Last name is required"
    if (!formData.gender) errors.gender = "Gender is required for medical records"
    if (!formData.contactNumber?.trim()) errors.contactNumber = "Contact number is required for emergencies"
    if (!formData.email?.trim()) errors.email = "Email is required for communication"
    if (isSelectedAcademicYearActive && !formData.status) errors.status = "Enrollment status is required"
    if (!formData.academicYearId) errors.academicYearId = "Academic year is required"
    return errors
  }

  const handleAddClinicianSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFormErrors({})
    setAddSuccessMessage("")
    setAddErrorMessage("")

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }

    const newClinicianData: NewClinician = {
      studentId: formData.studentId?.trim() || "",
      firstName: formData.firstName?.trim() || "",
      lastName: formData.lastName?.trim() || "",
      gender: formData.gender || "",
      status: isSelectedAcademicYearActive
        ? formData.status === "enrolled"
          ? "Enrolled"
          : "Not Enrolled"
        : "Not Enrolled",
      email: formData.email?.trim() || "",
      contactNumber: formData.contactNumber?.trim() || "",
      yearLevel: formData.yearLevel || "",
      academicYearId: formData.academicYearId,
    }

    try {
      const response = await fetch("/api/clinicians", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClinicianData),
      })

      const result = await response.json()

      if (response.ok) {
        setAddSuccessMessage(
          result.message ||
            `Successfully added ${newClinicianData.firstName} ${newClinicianData.lastName} to the system!`,
        )
        resetForm()
        fetchClinicians()
        setTimeout(() => {
          setAddSuccessMessage("")
          setIsAddModalOpen(false)
        }, 3000)
      } else {
        setAddErrorMessage(result.message || "Failed to add clinician. Please try again.")
        setAddSuccessMessage("")
      }
    } catch (error) {
      console.error("Error adding clinician:", error)
      setAddErrorMessage("An unexpected error occurred. Please try again.")
      setAddSuccessMessage("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const isCsv = !!file && (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv"))
    if (isCsv) {
      setSelectedFile(file)
      setUploadErrorMessage("")
      setUploadSuccessMessage("")
    } else {
      setSelectedFile(null)
      setUploadErrorMessage("Please select a valid .csv file")
      setUploadSuccessMessage("")
    }
  }

  const processCSVFile = async () => {
    if (!selectedFile) {
      setUploadErrorMessage("Please select a CSV file to upload.")
      return
    }

    if (!currentUserId) {
      setUploadErrorMessage("User not authenticated. Please log in and try again.")
      return
    }

    if (!formData.academicYearId) {
      setUploadErrorMessage("Please select an academic year before uploading the CSV file.")
      return
    }

    setIsProcessingUpload(true)
    setUploadSuccessMessage("")
    setUploadErrorMessage("")
    try {
      const result = await uploadCliniciansCsv(
        selectedFile,
        currentUserId,
        "chief-of-clinicians",
        formData.academicYearId,
      )
      if (result.status === "success") {
        setUploadSuccessMessage(result.message)
        setSelectedFile(null)
        fetchClinicians()
        setTimeout(() => {
          setUploadSuccessMessage("")
          setIsUploadModalOpen(false)
        }, 3000)
      } else if (result.status === "partial_success") {
        setUploadErrorMessage(result.message)
      } else {
        setUploadErrorMessage(result.message || "There was an error during import.")
      }
    } catch (error) {
      console.error("Error during CSV upload:", error)
      setUploadErrorMessage("There's an error while uploading the file due to an unexpected client-side issue.")
    } finally {
      setIsProcessingUpload(false)
    }
  }

  const filteredClinicians = clinicians.filter((clinician) => {
    let matchesStatus = true
    let matchesSearch = true

    // Status filtering
    if (activeFilter === "all") matchesStatus = true
    else if (activeFilter === "enrolled") matchesStatus = clinician.status === "Enrolled"
    else if (activeFilter === "not-enrolled") matchesStatus = clinician.status === "Not Enrolled"

    // Search filtering (searches across multiple fields)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      matchesSearch =
        clinician.studentId?.toLowerCase().includes(query) ||
        clinician.firstName?.toLowerCase().includes(query) ||
        clinician.lastName?.toLowerCase().includes(query) ||
        clinician.email?.toLowerCase().includes(query) ||
        clinician.yearLevel?.toLowerCase().includes(query) ||
        clinician.gender?.toLowerCase().includes(query)
    }

    return matchesStatus && matchesSearch
  })

  const getSelectedAcademicYearStatus = () => {
    if (!formData.academicYearId) return null
    const selectedYear = academicYears.find((year) => year.id === formData.academicYearId)
    return selectedYear?.status || null
  }

  const totalPages = Math.ceil(filteredClinicians.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCliniciansPage = filteredClinicians.slice(startIndex, endIndex)

  const isSelectedAcademicYearActive = getSelectedAcademicYearStatus() === "Active"

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Title */}
          <h1 className="text-2xl font-semibold text-gray-800">List of Clinicians</h1>

          {/* Right: Search + Add Clinician */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5C8E77] focus:border-transparent w-[250px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Add Clinician Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Clinician
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    resetForm()
                    setIsAddModalOpen(true)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Add Manually</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload CSV</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || activeFilter !== "all") && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Badge variant="outline" className="gap-1 pr-1">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeFilter !== "all" && (
              <Badge variant="outline" className="gap-1 pr-1">
                Status: {activeFilter}
                <button onClick={() => setActiveFilter("all")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setActiveFilter("all")
              }}
              className="h-7 text-xs text-gray-600 hover:text-gray-900"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Search className="h-4 w-4" />
            <span>
              Found <strong>{filteredClinicians.length}</strong> result
              {filteredClinicians.length !== 1 ? "s" : ""} for "{searchQuery}"
            </span>
            <button onClick={() => setSearchQuery("")} className="text-[#5C8E77] hover:underline font-medium">
              Clear search
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
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
      
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        {/* <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Clinician
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  resetForm()
                  setIsAddModalOpen(true)
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Add Manually</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader> */}
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Student ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Year</TableHead>
                <TableHead className="font-medium text-[#333]">Gender</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCliniciansPage.length > 0 ? (
                currentCliniciansPage.map((clinician) => (
                  <TableRow key={clinician.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{clinician.studentId}</TableCell>
                    <TableCell className="text-[#333]">{clinician.firstName}</TableCell>
                    <TableCell className="text-[#333]">{clinician.lastName}</TableCell>
                    <TableCell className="text-[#333]">{clinician.yearLevel}</TableCell>
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
                          className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                          onClick={() => handleEditClick(clinician)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    No clinicians found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredClinicians.length > 0 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show</span>
                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                              setItemsPerPage(Number(value))
                              setCurrentPage(1)
                            }}
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
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredClinicians.length)} of{" "}
                            {filteredClinicians.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter((page) => {
                                if (totalPages <= 7) return true
                                if (page === 1 || page === totalPages) return true
                                if (Math.abs(page - currentPage) <= 1) return true
                                return false
                              })
                              .map((page, index, array) => (
                                <div key={page} className="flex items-center">
                                  {index > 0 && array[index - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 p-0 ${currentPage === page ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}`}
                                  >
                                    {page}
                                  </Button>
                                </div>
                              ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
    </div>

      {/* <div className="mb-6">
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
       */}

      <>
        {/* Edit Clinician Modal */}
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open)
            if (!open) {
              setTimeout(() => setCurrentClinician(null), 100)
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
            {currentClinician && (
              <>
                <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                  <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Clinician</DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Update clinician information for {currentClinician.firstName} {currentClinician.lastName}
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="personal">Personal Information</TabsTrigger>
                      <TabsTrigger value="academic">Academic Information</TabsTrigger>
                    </TabsList>
                    <TabsContent value="personal" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-studentId" className="text-[#333]">
                          Student ID
                        </Label>
                        <Input
                          id="edit-studentId"
                          defaultValue={currentClinician.studentId}
                          onChange={(e) => setCurrentClinician({ ...currentClinician, studentId: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName" className="text-[#333]">
                            First Name
                          </Label>
                          <Input
                            id="edit-firstName"
                            defaultValue={currentClinician.firstName}
                            onChange={(e) => setCurrentClinician({ ...currentClinician, firstName: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName" className="text-[#333]">
                            Last Name
                          </Label>
                          <Input
                            id="edit-lastName"
                            defaultValue={currentClinician.lastName}
                            onChange={(e) => setCurrentClinician({ ...currentClinician, lastName: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-gender" className="text-[#333]">
                            Gender
                          </Label>
                          <Select
                            defaultValue={currentClinician.gender.toLowerCase()}
                            onValueChange={(value) =>
                              setCurrentClinician({
                                ...currentClinician,
                                gender: value.charAt(0).toUpperCase() + value.slice(1),
                              })
                            }
                          >
                            <SelectTrigger id="edit-gender" className="border-gray-300">
                              <SelectValue placeholder={currentClinician.gender} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-email" className="text-[#333]">
                            Email
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            defaultValue={currentClinician.email}
                            onChange={(e) => setCurrentClinician({ ...currentClinician, email: e.target.value })}
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-contactNumber" className="text-[#333]">
                          Contact Number
                        </Label>
                        <Input
                          id="edit-contactNumber"
                          defaultValue={currentClinician.contactNumber}
                          onChange={(e) => setCurrentClinician({ ...currentClinician, contactNumber: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="academic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-yearLevel" className="text-[#333]">
                          Year Level
                        </Label>
                        <Select
                          defaultValue={currentClinician.yearLevel}
                          onValueChange={(value) =>
                            setCurrentClinician({
                              ...currentClinician,
                              yearLevel: value,
                            })
                          }
                        >
                          <SelectTrigger id="edit-yearLevel" className="border-gray-300">
                            <SelectValue placeholder={currentClinician.yearLevel} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                            <SelectItem value="5th Year">5th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-[#333]">
                          Enrollment Status
                        </Label>
                        <Select
                          defaultValue={currentClinician.status.toLowerCase().replace(" ", "-")}
                          onValueChange={(value) =>
                            setCurrentClinician({
                              ...currentClinician,
                              status: value === "enrolled" ? "Enrolled" : "Not Enrolled",
                            })
                          }
                        >
                          <SelectTrigger id="edit-status" className="border-gray-300">
                            <SelectValue placeholder={currentClinician.status} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300">
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                    onClick={() => handleUpdateClinician(currentClinician)}
                  >
                    Update Clinician
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload CSV Modal */}
        <Dialog
          open={isUploadModalOpen}
          onOpenChange={(open) => {
            setIsUploadModalOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedFile(null)
                setUploadSuccessMessage("")
                setUploadErrorMessage("")
              }, 100)
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
            <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Upload Clinicians CSV</DialogTitle>
              <DialogDescription className="text-gray-500">
                Upload a CSV file containing clinician information.
              </DialogDescription>
            </DialogHeader>
            {uploadSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-6 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 break-words">{uploadSuccessMessage}</p>
                  </div>
                </div>
              </div>
            )}
            {uploadErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 break-words">{uploadErrorMessage}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvAcademicYear" className="text-[#333]">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.academicYearId || ""}
                  onValueChange={(value) => updateFormData("academicYearId", value)}
                  disabled={isLoadingAcademicYears}
                >
                  <SelectTrigger id="csvAcademicYear" className="border-gray-300">
                    <SelectValue placeholder={isLoadingAcademicYears ? "Loading..." : "Please select academic year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.academicYear} - {year.semester} Semester {year.status === "Inactive" ? "(Inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Select the academic year for the clinicians being uploaded</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full flex flex-col items-center justify-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-[#333] mb-2">
                  {selectedFile ? selectedFile.name : "Drag and drop your CSV file"}
                </h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  {selectedFile
                    ? "File selected. Click upload to process."
                    : "or click to browse files from your computer"}
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  ref={fileInputRef}
                />
                <label htmlFor="csv-upload">
                  <Button
                    className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </label>
              </div>
              <div className="mt-6 w-full">
                <h4 className="text-sm font-medium text-[#333] mb-2">CSV Format Requirements:</h4>
                <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                  <li>First row must contain column headers</li>
                  <li>Required columns: Student ID, First Name, Last Name, Gender, Email, Contact Number, Status</li>
                  <li>Optional columns: Year Level</li>
                  <li>Status must be either &quot;Enrolled&quot; or &quot;Not Enrolled&quot;</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} className="border-gray-300">
                Cancel
              </Button>
              <Button
                className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                onClick={processCSVFile}
                disabled={!selectedFile || isProcessingUpload}
              >
                {isProcessingUpload ? "Processing..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clinician Records View Modal */}
<Dialog
  open={isViewModalOpen}
  onOpenChange={(open) => {
    setIsViewModalOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedClinician(null);
        setClinicianActivities(null);
        setActivitiesError("");
        setSelectedAcademicYearTab("");
      }, 100);
    }
  }}
>
  <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden rounded-lg">
    {selectedClinician && (
      <>
        <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-[#5C8E77]">
                Clinician Records
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Viewing records for {selectedClinician.firstName} {selectedClinician.lastName}
              </p>
            </div>
            {/* <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-[#e6f7eb] flex items-center justify-center text-[#5C8E77] text-xl font-bold">
                {selectedClinician.firstName.charAt(0)}
                {selectedClinician.lastName.charAt(0)}
              </div>
            </div> */}
          </div>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Clinician Basic Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
              <p className="text-[#333] font-medium">{selectedClinician.studentId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="text-[#333] font-medium">
                {selectedClinician.firstName} {selectedClinician.lastName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Gender</h3>
              <p className="text-[#333] font-medium">{selectedClinician.gender}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Year Level</h3>
              <p className="text-[#333] font-medium">{selectedClinician.yearLevel}</p>
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

          {/* Loading State */}
          {isLoadingActivities && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C8E77] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading activities...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {activitiesError && !isLoadingActivities && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-amber-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-amber-800">{activitiesError}</p>
              </div>
            </div>
          )}

          {/* Activities by Academic Year with Tabs */}
          {!isLoadingActivities && clinicianActivities && clinicianActivities.academic_years.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#333]">
                  Activities Overview
                </h3>
                <Badge className="bg-[#5C8E77]">
                  {clinicianActivities.totalActivities} Total Activities
                </Badge>
              </div>

              <Tabs value={selectedAcademicYearTab} onValueChange={setSelectedAcademicYearTab} className="w-full">
                <TabsList className="grid w-full gap-2 h-15" style={{ gridTemplateColumns: `repeat(${clinicianActivities.academic_years.length}, minmax(0, 1fr))` }}>
                  {clinicianActivities.academic_years.map((academicYear: any) => (
                    <TabsTrigger 
                      key={academicYear.academic_year_id} 
                      value={academicYear.academic_year_id}
                      className="data-[state=active]:bg-[#5C8E77] data-[state=active]:text-white"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{academicYear.academic_year_id}</span>
                        <span className="text-xs opacity-80">
                          {academicYear.activityCount} {academicYear.activityCount === 1 ? 'Activity' : 'Activities'}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {clinicianActivities.academic_years.map((academicYear: any) => (
                  <TabsContent key={academicYear.academic_year_id} value={academicYear.academic_year_id} className="mt-4">
                    <div className="space-y-4">
                      {academicYear.activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No activities found for this academic year.
                        </div>
                      ) : (
                        academicYear.activities.map((activity: any) => (
                          <div key={activity.activity_id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            {/* Activity Header */}
                            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold text-[#333]">
                                    {activity.patientName || 'Unknown Patient'}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {activity.patientType} • {activity.shift}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    {activity.dateStarted} - {activity.dateEnded}
                                  </p>
                                  <Badge variant="outline" className="mt-1">
                                    {activity.recordCount} {activity.recordCount === 1 ? 'Session' : 'Sessions'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Procedures */}
                            <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Procedures:</p>
                              <div className="flex flex-wrap gap-2">
                                {activity.procedures.map((procedure: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="bg-white">
                                    {procedure}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* All Records/Sessions */}
                            <div className="p-4 space-y-3">
                              {activity.allRecords.map((record: any, recordIdx: number) => (
                                <div key={record.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="font-medium text-[#333]">
                                      Session {recordIdx + 1} - {record.date}
                                    </h6>
                                    <span className="text-sm text-gray-600">
                                      {record.timeIn} - {record.timeOut}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-gray-500">Instructor</p>
                                      <p className="text-sm font-medium text-[#333]">{record.instructorName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Chair</p>
                                      <p className="text-sm font-medium text-[#333]">{record.chair}</p>
                                    </div>
                                    {record.clerkName !== "N/A" && (
                                      <div>
                                        <p className="text-xs text-gray-500">Clerk</p>
                                        <p className="text-sm font-medium text-[#333]">{record.clerkName}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Procedure Statuses */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700">Procedure Details:</p>
                                    {record.procedureStatuses.map((procStatus: any, idx: number) => (
                                      <div key={procStatus.ap_id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-sm text-[#333]">
                                            {procStatus.procedure}
                                          </span>
                                          <Badge 
                                            className={
                                              procStatus.status === 'Approved' ? 'bg-green-500 hover:bg-green-600' :
                                              procStatus.status === 'Pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                              procStatus.status === 'Rejected' ? 'bg-red-500 hover:bg-red-600' :
                                              'bg-gray-500 hover:bg-gray-600'
                                            }
                                          >
                                            {procStatus.status}
                                          </Badge>
                                        </div>
                                        {procStatus.remarks && procStatus.remarks !== "No remarks" && (
                                          <p className="text-xs text-gray-600 italic">
                                            Remarks: {procStatus.remarks}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingActivities && clinicianActivities && clinicianActivities.academic_years.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No activities found for this clinician.</p>
            </div>
          )}

          {!isLoadingActivities && !clinicianActivities && !activitiesError && (
            <div className="text-center py-12">
              <p className="text-gray-500">No activities found for this clinician.</p>
            </div>
          )}
        </div>
      </>
    )}
  </DialogContent>
</Dialog>

        {/* Add Clinician Modal */}
        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open)
            if (!open) {
              setTimeout(() => resetForm(), 100)
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
            <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Add New Clinician</DialogTitle>
              <DialogDescription className="text-gray-500">
                Enter the clinician details to add them to the system.
              </DialogDescription>
            </DialogHeader>
            {addSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-6 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{addSuccessMessage}</p>
                  </div>
                </div>
              </div>
            )}
            {addErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 break-words">{addErrorMessage}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleAddClinicianSubmit}>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="academic">Academic Information</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-[#333]">
                        Student ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="studentId"
                        value={formData.studentId || ""}
                        onChange={(e) => updateFormData("studentId", e.target.value)}
                        placeholder="Enter student ID"
                        className={formErrors.studentId ? "border-red-500" : "border-gray-300"}
                      />
                      {formErrors.studentId && <p className="text-sm text-red-500">{formErrors.studentId}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[#333]">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName || ""}
                          onChange={(e) => updateFormData("firstName", e.target.value)}
                          placeholder="Enter first name"
                          className={formErrors.firstName ? "border-red-500" : "border-gray-300"}
                        />
                        {formErrors.firstName && <p className="text-sm text-red-500">{formErrors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[#333]">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName || ""}
                          onChange={(e) => updateFormData("lastName", e.target.value)}
                          placeholder="Enter last name"
                          className={formErrors.lastName ? "border-red-500" : "border-gray-300"}
                        />
                        {formErrors.lastName && <p className="text-sm text-red-500">{formErrors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#333]">
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.gender || ""} onValueChange={(value) => updateFormData("gender", value)}>
                        <SelectTrigger id="gender" className={formErrors.gender ? "border-red-500" : "border-gray-300"}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.gender && <p className="text-sm text-red-500">{formErrors.gender}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#333]">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="Enter email address"
                        className={formErrors.email ? "border-red-500" : "border-gray-300"}
                      />
                      {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber" className="text-[#333]">
                        Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber || ""}
                        onChange={(e) => updateFormData("contactNumber", e.target.value)}
                        placeholder="Enter contact number"
                        className={formErrors.contactNumber ? "border-red-500" : "border-gray-300"}
                      />
                      {formErrors.contactNumber && <p className="text-sm text-red-500">{formErrors.contactNumber}</p>}
                    </div>
                  </TabsContent>
                  <TabsContent value="academic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear" className="text-[#333]">
                        Academic Year <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.academicYearId || ""}
                        onValueChange={(value) => updateFormData("academicYearId", value)}
                        disabled={isLoadingAcademicYears}
                      >
                        <SelectTrigger
                          id="academicYear"
                          className={formErrors.academicYearId ? "border-red-500" : "border-gray-300"}
                        >
                          <SelectValue
                            placeholder={isLoadingAcademicYears ? "Loading..." : "Please select academic year"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.academicYear} - {year.semester} Semester{" "}
                              {year.status === "Inactive" ? "(Inactive)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.academicYearId && <p className="text-sm text-red-500">{formErrors.academicYearId}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearLevel" className="text-[#333]">
                        Year Level
                      </Label>
                      <Select
                        value={formData.yearLevel || ""}
                        onValueChange={(value) => updateFormData("yearLevel", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Year Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          <SelectItem value="5th Year">5th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isSelectedAcademicYearActive && (
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-[#333]">
                          Enrollment Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.status || ""}
                          onValueChange={(value) => updateFormData("status", value)}
                        >
                          <SelectTrigger
                            id="status"
                            className={formErrors.status ? "border-red-500" : "border-gray-300"}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.status && <p className="text-sm text-red-500">{formErrors.status}</p>}
                      </div>
                    )}
                    {formData.academicYearId && !isSelectedAcademicYearActive && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-amber-800">
                              This academic year is inactive. Enrollment status is not required for inactive academic
                              years.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#5C8E77] hover:bg-[#406E58] text-white" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Clinician"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    </>
  )
}
