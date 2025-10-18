"use client"

import { useState, useEffect } from "react"
import { Edit, Info, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { getProcedures } from "@/app/api/form/clinician/action"

// Update the Chair interface
interface Chair {
  id: string
  chair_name?: string
  procedures: string[]
  status: "Available" | "Occupied" | "Under Maintenance"
  student: string | null
}

interface Procedure {
  procedure_id: string
  name: string
  procedure_code?: string
}

type FilterType = "all" | "available" | "occupied" | "maintenance"

// Narrow unknown strings to our three allowed values; fallback stays undefined
function coerceStatus(val: unknown): Chair["status"] | undefined {
  if (val === "Available" || val === "Occupied" || val === "Under Maintenance") return val
  return undefined
}

// Update the getStatusBadge function with safe fallback
const getStatusBadge = (status: Chair["status"] | undefined) => {
  switch (status) {
    case "Available":
      return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">Available</Badge>
    case "Occupied":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Occupied
        </Badge>
      )
    case "Under Maintenance":
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          Under Maintenance
        </Badge>
      )
    default:
      return <Badge variant="outline">—</Badge>
  }
}

export default function ChairPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentChair, setCurrentChair] = useState<Chair | null>(null)
  const [chairs, setChairs] = useState<Chair[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [updating, setUpdating] = useState<boolean>(false)
  const [dentalProcedures, setProcedures] = useState<Procedure[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log("🔍 Client session check:")
        console.log("- Session exists:", !!session)
        console.log("- User ID:", session?.user?.id)

        const { error: procedureError, procedures: procedureData } = await getProcedures()
        if (procedureError) {
          console.error("Error fetching procedures:", procedureError)
        } else {
          setProcedures(procedureData)
        }

      } catch (err) {
        console.error("❌ Session check failed:", err)
      }
    }
    
    checkSession()
    fetchChairs()
  }, [])

  const fetchChairs = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Fetching chairs from client...")

      const response = await fetch("/api/dental-chairs", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      })

      console.log("- Response status:", response.status)

      const raw = await response.json()
      console.log("- Response body:", raw)

      if (!response.ok) {
        const msg = (raw && (raw.error || raw.message)) || "Failed to fetch dental chairs"
        throw new Error(msg)
      }

      // Support both shapes: API returns a plain array of chairs or { data: Chair[] }
      const payload = Array.isArray(raw) ? raw : raw?.data || []

      // Light runtime normalization
      const normalized: Chair[] = (payload as any[]).map((c, i) => {
        const status = coerceStatus(c?.status)
        return {
          id: String(c?.id ?? c?.chair_id ?? `chair-${i + 1}`),
          chair_name: c?.chair_name,
          procedures: Array.isArray(c?.procedures) ? c.procedures.filter(Boolean) : [],
          status: status ?? "Available",
          student: c?.student ?? null,
        }
      })

      setChairs(normalized)
    } catch (err) {
      console.error("❌ Client error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch chairs")
    } finally {
      setLoading(false)
    }
  }

  // Function to handle edit button click
  const handleEditClick = (chair: Chair) => {
    setCurrentChair({ ...chair })
    setIsEditModalOpen(true)
  }

  // Function to update chair (now with API call)
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

  // Filter logic
  const filteredChairs = chairs.filter((chair) => {
    if (activeFilter === "all") return true
    if (activeFilter === "available") return chair.status === "Available"
    if (activeFilter === "occupied") return chair.status === "Occupied"
    if (activeFilter === "maintenance") return chair.status === "Under Maintenance"
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chairs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
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

      {/* Information Alert */}
      <Alert className="mb-6 bg-[#5C8E77]/10 border-[#5C8E77]/20">
        <Info className="h-4 w-4 text-[#5C8E77]" />
        <AlertDescription className="text-[#333]">
          Chairs are automatically assigned to students upon confirmed attendance based on procedure needs and chair
          availability. You can manage chair status and associated procedures here.
        </AlertDescription>
      </Alert>

      {/* Chairs Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">List of Dental Chairs</CardTitle>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "all" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("all")}
              >
                All ({chairs.length})
              </Button>
              <Button
                variant={activeFilter === "available" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "available" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("available")}
              >
                Available ({chairs.filter(c => c.status === "Available").length})
              </Button>
              <Button
                variant={activeFilter === "occupied" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "occupied" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("occupied")}
              >
                Occupied ({chairs.filter(c => c.status === "Occupied").length})
              </Button>
              <Button
                variant={activeFilter === "maintenance" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "maintenance" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("maintenance")}
              >
                Maintenance ({chairs.filter(c => c.status === "Under Maintenance").length})
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#5C8E77]"></div>
              <span className="text-xs text-gray-500">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-600"></div>
              <span className="text-xs text-gray-500">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-600"></div>
              <span className="text-xs text-gray-500">Under Maintenance</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Chairs</TableHead>
                {/* <TableHead className="font-medium text-[#333]">Chair Name</TableHead> */}
                <TableHead className="font-medium text-[#333]">Procedures</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChairs.length > 0 ? (
                filteredChairs.map((chair) => (
                  <TableRow key={chair.id} className="hover:bg-gray-50 border-b border-gray-200">
                    {/* <TableCell className="font-medium text-[#333]">{chair.id}</TableCell> */}
                    <TableCell className="text-[#333]">{chair.chair_name || "—"}</TableCell>
                    <TableCell className="text-[#333]">
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
                    <TableCell>{getStatusBadge(chair.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                        onClick={() => handleEditClick(chair)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
                        <div key={procedure.procedure_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-procedure-${procedure.procedure_id}`}
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
                          <Label htmlFor={`edit-procedure-${procedure.procedure_id}`} className="text-sm font-normal">
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