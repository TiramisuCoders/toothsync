"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

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
        student = "Maria Santos" //students[Math.floor(Math.random() * students.length)]
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-2">
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                      No chairs found matching the selected filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
