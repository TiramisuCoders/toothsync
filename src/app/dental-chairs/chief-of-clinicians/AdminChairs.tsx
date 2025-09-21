"use client"

import { useState, useEffect } from "react"
import { Edit, Info } from "lucide-react"
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

// Update the Chair interface (back to original three states)
interface Chair {
  id: string
  procedures: string[]
  status: "Available" | "Occupied" | "Under Maintenance"
  student: string | null
}

// Update the FilterType back to original
type FilterType = "all" | "available" | "occupied" | "maintenance"

// Available dental procedures
const dentalProcedures = [
  "Extraction",
  "Root Canal",
  "Dental Filling",
  "Dental Crown",
  "Teeth Cleaning",
  "General Dentistry",
  "Orthodontics",
  "Periodontics",
  "Prosthodontics",
]

// Narrow unknown strings to our three allowed values; fallback stays undefined
function coerceStatus(val: unknown): Chair["status"] | undefined {
  if (val === "Available" || val === "Occupied" || val === "Under Maintenance") return val
  return undefined
}

// Update the getStatusBadge function (back to original) + safe fallback
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log("🔍 Client session check:")
        console.log("- Session exists:", !!session)
        console.log("- User ID:", session?.user?.id)
        console.log("- Access token exists:", !!session?.access_token)
        console.log("- Session error:", error)
        console.log("- Document cookies:", document.cookie)
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
      console.log("🔍 Fetching from client...")

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

      if (!response.ok) {
        const msg = (raw && (raw.error || raw.message)) || "Failed to fetch dental chairs"
        throw new Error(msg)
      }

      // Support both shapes:
      // 1) API returns a plain array of chairs
      // 2) API returns { data: Chair[] }
      const payload = Array.isArray(raw) ? raw : raw?.data || []

      // Light runtime normalization to keep TS happy and UI robust
      const normalized: Chair[] = (payload as any[]).map((c, i) => {
        const status = coerceStatus(c?.status) // undefined if unknown
        return {
          id: String(c?.id ?? c?.chair_id ?? `chair-${i + 1}`),
          procedures: Array.isArray(c?.procedures) ? c.procedures.filter(Boolean) : [],
          status: status ?? "Available", // fallback to Available if API omits/uses null; adjust if needed
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

  // Function to update chair (local-only for now)
  const handleUpdateChair = async (updatedChair: Chair) => {
    try {
      setChairs((prev) => prev.map((c) => (c.id === updatedChair.id ? updatedChair : c)))
      setIsEditModalOpen(false)
      // TODO: PUT /api/dental-chairs/:id to persist
    } catch (err) {
      console.error("Error updating chair:", err)
      setError("Failed to update chair")
    }
  }

  // Update the filter logic (back to original)
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
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
          availability.
        </AlertDescription>
      </Alert>

      {/* Chairs Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">List of Dental Chairs</CardTitle>

            {/* Update the filter buttons section (back to original) */}
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
                variant={activeFilter === "available" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "available" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("available")}
              >
                Available
              </Button>
              <Button
                variant={activeFilter === "occupied" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "occupied" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("occupied")}
              >
                Occupied
              </Button>
              <Button
                variant={activeFilter === "maintenance" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "maintenance" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("maintenance")}
              >
                Under Maintenance
              </Button>
            </div>
          </div>

          {/* Update the legend section (back to original) */}
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
                <TableHead className="font-medium text-[#333]">Dental Chair ID</TableHead>
                <TableHead className="font-medium text-[#333]">Procedures</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChairs.length > 0 ? (
                filteredChairs.map((chair) => (
                  <TableRow key={chair.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{chair.id}</TableCell>
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
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
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
                  Update information for {currentChair.id}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Update the Select options in the edit modal (back to original) */}
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

                  {currentChair.status === "Occupied" && (
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
                  )}

                  <div className="space-y-3">
                    <Label className="text-[#333]">Allowed Procedures</Label>
                    <p className="text-sm text-gray-500">
                      Select the dental procedures that can be performed on this chair. The system will only assign
                      students to chairs that support their required procedure.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dentalProcedures.map((procedure) => (
                        <div key={procedure} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-procedure-${procedure}`}
                            checked={currentChair.procedures?.includes(procedure) || false}
                            onCheckedChange={(checked) => {
                              const currentProcedures = currentChair.procedures || []
                              const updatedProcedures =
                                checked
                                  ? [...currentProcedures, procedure]
                                  : currentProcedures.filter((p) => p !== procedure)
                              setCurrentChair((prev) => prev ? { ...prev, procedures: updatedProcedures } : prev)
                            }}
                          />
                          <Label htmlFor={`edit-procedure-${procedure}`} className="text-sm font-normal">
                            {procedure}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                  onClick={() => currentChair && handleUpdateChair(currentChair)}
                >
                  Update Chair
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
