"use client"
import { useState, useRef, useEffect } from "react"
import { Eye, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentClinician, setCurrentClinician] = useState<Clinician | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null)
  const [clinicianActivities, setClinicianActivities] = useState<any>(null)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string>("")
  const [selectedAcademicYearTab, setSelectedAcademicYearTab] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("") // search state already exists
  const [addSuccessMessage, setAddSuccessMessage] = useState<string>("")
  const [addErrorMessage, setAddErrorMessage] = useState<string>("")
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [isLoadingAcademicYears, setIsLoadingAcademicYears] = useState(false)

  const [formData, setFormData] = useState<Partial<NewClinician>>({
    yearLevel: "",
  })
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
    setIsLoadingActivities(true)
    setActivitiesError("")
    try {
      const response = await fetch("/api/clinicians/activity_overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clinician_id: clinicianId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        setClinicianActivities(result.data)
      } else {
        setClinicianActivities(null)
        setActivitiesError(result.message || "No activities found for this clinician")
      }
    } catch (error) {
      console.error("Failed to fetch clinician activities:", error)
      setActivitiesError("Failed to load activities. Please try again.")
      setClinicianActivities(null)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const handleViewClick = (clinician: Clinician) => {
    setSelectedClinician(clinician)
    setIsViewModalOpen(true)
    // Fetch activities when modal opens
    fetchClinicianActivities(clinician.id)
  }
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

  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      ),
    )
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

  const totalPages = Math.ceil(filteredClinicians.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCliniciansPage = filteredClinicians.slice(startIndex, endIndex)

  const getSelectedAcademicYearStatus = () => {
    if (!formData.academicYearId) return null
    const selectedYear = academicYears.find((year) => year.id === formData.academicYearId)
    return selectedYear?.status || null
  }

  const isSelectedAcademicYearActive = getSelectedAcademicYearStatus() === "Active"

  if (isLoadingAcademicYears) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading clinicians...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">List of Clinicians</h1>
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
              Found <strong>{filteredClinicians.length}</strong> result{filteredClinicians.length !== 1 ? "s" : ""} for
              "{searchQuery}"
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
                    <TableCell className="font-medium text-[#333]">
                      {highlightText(clinician.studentId, searchQuery)}
                    </TableCell>
                    <TableCell className="text-[#333]">{highlightText(clinician.firstName, searchQuery)}</TableCell>
                    <TableCell className="text-[#333]">{highlightText(clinician.lastName, searchQuery)}</TableCell>
                    <TableCell className="text-[#333]">{highlightText(clinician.yearLevel, searchQuery)}</TableCell>
                    <TableCell className="text-[#333]">{highlightText(clinician.gender, searchQuery)}</TableCell>
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
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <Search className="h-12 w-12 text-gray-300" />
                      {searchQuery ? (
                        <>
                          <p className="text-lg font-medium">No results found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("")
                              setActiveFilter("all")
                            }}
                            className="mt-2"
                          >
                            Clear all filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-medium">No clinicians found</p>
                          <p className="text-sm">No clinicians match the current filters</p>
                        </>
                      )}
                    </div>
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
      {/* Clinician Records View Modal */}
      <Dialog
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) {
            setTimeout(() => {
              setSelectedClinician(null)
              setClinicianActivities(null)
              setActivitiesError("")
              setSelectedAcademicYearTab("")
            }, 100)
          }
        }}
      >
        <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden rounded-lg">
          {selectedClinician && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Clinician Records</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Viewing records for {selectedClinician.firstName} {selectedClinician.lastName}
                    </p>
                  </div>
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
                {/* Error State */}
                {activitiesError && !isLoadingActivities && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-amber-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium text-amber-800">{activitiesError}</p>
                    </div>
                  </div>
                )}
                {/* Activities by Academic Year with Tabs */}
                {!isLoadingActivities && clinicianActivities && clinicianActivities.academic_years.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#333]">Activities Overview</h3>
                      <Badge className="bg-[#5C8E77]">{clinicianActivities.totalActivities} Total Activities</Badge>
                    </div>
                    <Tabs value={selectedAcademicYearTab} onValueChange={setSelectedAcademicYearTab} className="w-full">
                      <TabsList
                        className="grid w-full gap-2 h-15"
                        style={{
                          gridTemplateColumns: `repeat(${clinicianActivities.academic_years.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {clinicianActivities.academic_years.map((academicYear: any) => (
                          <TabsTrigger
                            key={academicYear.academic_year_id}
                            value={academicYear.academic_year_id}
                            className="data-[state=active]:bg-[#5C8E77] data-[state=active]:text-white"
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{academicYear.academic_year_id}</span>
                              <span className="text-xs opacity-80">
                                {academicYear.activityCount}{" "}
                                {academicYear.activityCount === 1 ? "Activity" : "Activities"}
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {clinicianActivities.academic_years.map((academicYear: any) => (
                        <TabsContent
                          key={academicYear.academic_year_id}
                          value={academicYear.academic_year_id}
                          className="mt-4"
                        >
                          <div className="space-y-4">
                            {academicYear.activities.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                No activities found for this academic year.
                              </div>
                            ) : (
                              academicYear.activities.map((activity: any) => (
                                <div
                                  key={activity.activity_id}
                                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                                >
                                  {/* Activity Header */}
                                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h5 className="font-semibold text-[#333]">
                                          {activity.patientName || "Unknown Patient"}
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
                                          {activity.recordCount} {activity.recordCount === 1 ? "Session" : "Sessions"}
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
                                      <div
                                        key={record.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                      >
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
                                            <div
                                              key={procStatus.ap_id || idx}
                                              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm text-[#333]">
                                                  {procStatus.procedure}
                                                </span>
                                                <Badge
                                                  className={
                                                    procStatus.status === "Approved"
                                                      ? "bg-green-500 hover:bg-green-600"
                                                      : procStatus.status === "Pending"
                                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                                        : procStatus.status === "Rejected"
                                                          ? "bg-red-500 hover:bg-red-600"
                                                          : "bg-gray-500 hover:bg-gray-600"
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
    </div>
  )
}
