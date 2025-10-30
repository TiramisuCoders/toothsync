"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getDepartments } from "@/app/api/form/clinician/action"

interface Chair {
  id: string
  procedures: string[]
  chair_name?: string
  status: "Available" | "Occupied" | "Under Maintenance"
  shift1_status: "Available" | "Occupied" | "Under Maintenance"
  shift2_status: "Available" | "Occupied" | "Under Maintenance"
  student: string | null
}

interface Procedure {
  id: string
  name: string
}


type ChairStatus = "Available" | "Occupied" | "Under Maintenance"
type FilterType = "all" | "available" | "occupied" | "maintenance"
type UserRole = 'R01' | 'R02' | 'R04' // Clinician, Clerk, Admin

const getStatusBadge = (status: ChairStatus) => {
  switch (status) {
    case "Available":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Available
        </Badge>
      )
    case "Occupied":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Occupied
        </Badge>
      )
    case "Under Maintenance":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Under Maintenance
        </Badge>
      )
    default:
      return <Badge variant="outline">—</Badge>
  }
}

export default function ChairsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [chairs, setChairs] = useState<Chair[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentChair, setCurrentChair] = useState<Chair | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [updating, setUpdating] = useState<boolean>(false)
  const [dentalProcedures, setProcedures] = useState<Procedure[]>([])

  useEffect(() => {
    fetchChairs()
  }, [])

  const fetchChairs = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Fetching chairs from clinician side...")

      const response = await fetch("/api/dental-chairs", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      })

      console.log("- Response status:", response.status)
      console.log("- Response ok:", response.ok)

      const raw = await response.json()
      console.log("- Response body:", raw)

      if (raw.success) {
        setUserRole(raw.userRole) 
        console.log(userRole)
      }

      if (!response.ok) {
        const msg = (raw && (raw.error || raw.message)) || "Failed to fetch dental chairs"
        throw new Error(msg)
      }

      // Support both shapes: direct array or { data: Chair[] }
      const payload = Array.isArray(raw) ? raw : raw?.data || []

      // Normalize data
      const normalized: Chair[] = (payload as any[]).map((c, i) => {
        const status = (c?.status === "Available" || c?.status === "Occupied" || c?.status === "Under Maintenance") 
          ? c.status 
          : "Available"
        
        const shift1Status = (c?.shift1_status === "Available" || c?.shift1_status === "Occupied" || c?.shift1_status === "Under Maintenance") 
          ? c.shift1_status 
          : "Available"
          
        const shift2Status = (c?.shift2_status === "Available" || c?.shift2_status === "Occupied" || c?.shift2_status === "Under Maintenance") 
          ? c.shift2_status 
          : "Available"
        
        return {
          id: String(c?.id ?? c?.chair_id ?? `chair-${i + 1}`),
          chair_name: c?.chair_name,
          procedures: Array.isArray(c?.procedures) ? c.procedures.filter(Boolean) : [],
          status: status,
          shift1_status: shift1Status,
          shift2_status: shift2Status,
          student: c?.student ?? null,
        }
      })

      const { error: procedureError, departmentData: departmentData } = await getDepartments()
              if (procedureError) {
                console.error("Error fetching procedures:", procedureError)
              } else {
                setProcedures(departmentData)
              }

      setChairs(normalized)
    } catch (err) {
      console.error("❌ Clinician chairs fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch chairs")
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (chair: Chair) => {
    setCurrentChair({ ...chair })
    setIsEditModalOpen(true)
  }

  const handleUpdateChair = async (updatedChair: Chair) => {
    try {
      setUpdating(true)
      setError(null)

      console.log("🔄 Updating chair:", updatedChair)

      const response = await fetch("/api/dental-chairs", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chairId: updatedChair.id,
          status: updatedChair.status,
          procedures: updatedChair.procedures,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update chair")
      }

      // Update local state
      setChairs((prev) => prev.map((c) => (c.id === updatedChair.id ? updatedChair : c)))
      setIsEditModalOpen(false)
      setSuccessMessage("Chair updated successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)

    } catch (err) {
      console.error("Error updating chair:", err)
      setError(err instanceof Error ? err.message : "Failed to update chair")
    } finally {
      setUpdating(false)
    }
  }

  // Filter chairs based on selected filter
  const filteredChairs = chairs.filter((chair) => {
    if (activeFilter === "all") return true

    // Map filter values to actual status values with proper typing
    const statusMap: Record<Exclude<FilterType, "all">, ChairStatus> = {
      available: "Available",
      occupied: "Occupied",
      maintenance: "Under Maintenance",
    }

    const targetStatus = statusMap[activeFilter as Exclude<FilterType, "all">]
    
    // Filter if either shift matches the status OR if overall status matches
    return chair.shift1_status === targetStatus || 
           chair.shift2_status === targetStatus ||
           chair.status === targetStatus
  })

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Under Maintenance" },
  ]
   // Determine if user can edit (only instructors)
  const isChief = userRole === 'R04'
  const isClerk = userRole === 'R02'
  const isClinician = userRole === 'R01'

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#5C8E77] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading list of chairs...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredChairs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRecords = filteredChairs.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="link"
              className="p-0 h-auto ml-2 text-red-600"
              onClick={fetchChairs}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        {/* Header */}
        <h1 className="text-xl font-semibold text-[#333] mb-3">
          List of Chairs
        </h1>

        {/* Filters + Legend (same row) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters (left side) */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            {filterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "ghost"}
                size="sm"
                className={
                  activeFilter === filter.value
                    ? "bg-[#5C8E77] hover:bg-[#406E58]"
                    : ""
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Legend (right side) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#5C8E77]" />
              <span className="text-xs text-gray-500">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-600" />
              <span className="text-xs text-gray-500">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-600" />
              <span className="text-xs text-gray-500">Under Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chairs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold py-3">Chairs</TableHead>
                <TableHead className="font-semibold py-3">Procedures</TableHead>
                <TableHead className="font-semibold py-3">Shift 1</TableHead>
                <TableHead className="font-semibold py-3">Shift 2</TableHead>
                <TableHead className="font-semibold py-3">Overall Status</TableHead>
                { isChief && (
                  <TableHead className="font-semibold py-3">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length > 0 ? (
                currentRecords.map((chair) => (
                  <TableRow key={chair.id} className="hover:bg-gray-50 border-b">
                    <TableCell className="py-3">{chair.chair_name}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {chair.procedures?.length ? (
                          chair.procedures.map((procedure, index) => (
                            <Badge
                              key={`${procedure}-${index}`}
                              variant="outline"
                              className="bg-gray-100 text-gray-700 border-gray-300"
                            >
                              {procedure}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">No procedures assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {getStatusBadge(chair.shift1_status)}
                    </TableCell>
                    <TableCell className="py-3">
                      {getStatusBadge(chair.shift2_status)}
                    </TableCell>
                    <TableCell className="py-3">
                      {getStatusBadge(chair.status)}
                    </TableCell>
                    {isChief && (
                      <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                        onClick={() => handleEditClick(chair)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    No chairs found matching the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {chairs.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, chairs.length)} of {chairs.length}
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

       {/* Edit Chair Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {currentChair && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Dental Chair</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Update status and procedures for Chair 
                  {currentChair.chair_name && ` (${currentChair.chair_name})`}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Chair Status */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-[#333]">
                      Chair Status
                    </Label>
                    <Select
                      value={currentChair.status}
                      onValueChange={(value: Chair["status"]) =>
                        setCurrentChair((prev) => prev ? {
                          ...prev,
                          status: value,
                          student: value !== "Occupied" ? null : prev.student,
                        } : prev)
                      }
                    >
                      <SelectTrigger id="edit-status" className="border-gray-300">
                        <SelectValue placeholder={currentChair.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Occupied">Occupied</SelectItem>
                        <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* {currentChair.status === "Occupied" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-student" className="text-[#333]">
                        Assigned Student
                      </Label>
                      <Select
                        value={currentChair.student ?? ""}
                        onValueChange={(value: string) =>
                          setCurrentChair((prev) => prev ? { ...prev, student: value } : prev)
                        }
                      >
                        <SelectTrigger id="edit-student" className="border-gray-300">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                          <SelectItem value="John Dela Cruz">John Dela Cruz</SelectItem>
                          <SelectItem value="Anna Lim">Anna Lim</SelectItem>
                          <SelectItem value="Mark Aquino">Mark Aquino</SelectItem>
                          <SelectItem value="Sarah Garcia">Sarah Garcia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )} */}

                  <div className="space-y-3">
                    <Label className="text-[#333]">Allowed Procedures</Label>
                    <p className="text-sm text-gray-500">
                      Select the dental procedures that can be performed on this chair. The system will only assign
                      students to chairs that support their required procedure.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {dentalProcedures.map((procedure) => (
                        <div key={procedure.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-procedure-${procedure.id}`}
                            checked={currentChair.procedures?.includes(procedure.name) || false}
                            onCheckedChange={(checked) => {
                              const currentProcedures = currentChair.procedures || []
                              const updatedProcedures =
                                checked
                                  ? [...currentProcedures, procedure.name]
                                  : currentProcedures.filter((p) => p !== procedure.name)
                              setCurrentChair((prev) => prev ? { ...prev, procedures: updatedProcedures } : prev)
                            }}
                          />
                          <Label htmlFor={`edit-procedure-${procedure.id}`} className="text-sm font-normal">
                            {procedure.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="border-gray-300"
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                  onClick={() => currentChair && handleUpdateChair(currentChair)}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Chair"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}