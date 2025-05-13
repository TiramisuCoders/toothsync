"use client"

import { useState } from "react"
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
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ChairPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentChair, setCurrentChair] = useState(null)

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

  // Sample data for chairs
  const [chairs, setChairs] = useState(
    Array.from({ length: 30 }, (_, i) => {
      const chairNumber = i + 1
      // Randomly assign status and procedures
      const statusOptions = ["Available", "Occupied", "Under Maintenance"]
      const status = statusOptions[Math.floor(Math.random() * (chairNumber % 10 === 0 ? 3 : 2))]

      // Assign procedures based on chair number
      let procedures = []
      if (chairNumber <= 10) {
        procedures = ["General Dentistry", "Teeth Cleaning"]
      } else if (chairNumber <= 20) {
        procedures = ["Extraction", "Root Canal", "Dental Filling"]
      } else {
        procedures = ["Dental Crown", "Orthodontics", "Periodontics"]
      }

      // If chair is occupied, assign a student
      let student = null
      if (status === "Occupied") {
        const students = ["Maria Santos", "John Dela Cruz", "Anna Lim", "Mark Aquino", "Sarah Garcia"]
        student = students[Math.floor(Math.random() * students.length)]
      }

      return {
        id: `Chair ${chairNumber}`,
        procedures,
        status,
        student,
      }
    }),
  )

  // Function to handle edit button click
  const handleEditClick = (chair) => {
    setCurrentChair(chair)
    setIsEditModalOpen(true)
  }

  // Function to update chair
  const handleUpdateChair = (updatedChair) => {
    setChairs(chairs.map((chair) => (chair.id === updatedChair.id ? updatedChair : chair)))
    setIsEditModalOpen(false)
  }

  // Function to get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{status}</Badge>
      case "Occupied":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {status}
          </Badge>
        )
      case "Under Maintenance":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter chairs based on active filter
  const filteredChairs = chairs.filter((chair) => {
    if (activeFilter === "all") return true
    if (activeFilter === "available") return chair.status === "Available"
    if (activeFilter === "occupied") return chair.status === "Occupied"
    if (activeFilter === "maintenance") return chair.status === "Under Maintenance"
    return true
  })

  return (
    <DashboardLayout>
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
                        {chair.procedures.map((procedure) => (
                          <Badge
                            key={procedure}
                            variant="outline"
                            className="bg-gray-100 text-gray-700 border-gray-300"
                          >
                            {procedure}
                          </Badge>
                        ))}
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-[#333]">
                      Chair Status
                    </Label>
                    <Select
                      defaultValue={currentChair.status}
                      onValueChange={(value) => setCurrentChair({ ...currentChair, status: value })}
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
                        defaultValue={currentChair.student || ""}
                        onValueChange={(value) => setCurrentChair({ ...currentChair, student: value })}
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
                            checked={currentChair.procedures.includes(procedure)}
                            onCheckedChange={(checked) => {
                              const updatedProcedures = checked
                                ? [...currentChair.procedures, procedure]
                                : currentChair.procedures.filter((p) => p !== procedure)
                              setCurrentChair({
                                ...currentChair,
                                procedures: updatedProcedures,
                              })
                            }}
                          />
                          <Label htmlFor={`edit-procedure-${procedure}`} className="text-sm font-normal">
                            {procedure}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="edit-notes" className="text-[#333]">
                      Notes (Optional)
                    </Label>
                    <textarea
                      id="edit-notes"
                      className="w-full min-h-[100px] rounded-md border border-gray-300 p-2"
                      placeholder="Add any special notes about this chair..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                  onClick={() => handleUpdateChair(currentChair)}
                >
                  Update Chair
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
