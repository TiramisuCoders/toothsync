"use client"

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Type definitions
interface Chair {
  id: string
  procedures: string[]
  status: ChairStatus
  student: string | null
}

type ChairStatus = "Available" | "Occupied" | "Under Maintenance"
type FilterType = "all" | "available" | "occupied" | "maintenance"

export default function ChairPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [chairs, setChairs] = useState<Chair[]>([])

  useEffect(() => {
    const students = ["Maria Santos", "John Dela Cruz", "Anna Lim", "Mark Aquino", "Sarah Garcia"]
    const statusOptions: ChairStatus[] = ["Available", "Occupied", "Under Maintenance"]

    const generatedChairs: Chair[] = Array.from({ length: 30 }, (_, i) => {
      const chairNumber = i + 1
      const status = statusOptions[Math.floor(Math.random() * (chairNumber % 10 === 0 ? 3 : 2))]

      let procedures: string[] = []
      if (chairNumber <= 10) {
        procedures = ["General Dentistry", "Teeth Cleaning"]
      } else if (chairNumber <= 20) {
        procedures = ["Extraction", "Root Canal", "Dental Filling"]
      } else {
        procedures = ["Dental Crown", "Orthodontics", "Periodontics"]
      }

      const student = status === "Occupied" ? students[Math.floor(Math.random() * students.length)] : null

      return {
        id: `Chair ${chairNumber}`,
        procedures,
        status,
        student,
      }
    })

    setChairs(generatedChairs)
  }, [])

  const getStatusBadge = (status: ChairStatus) => {
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

  // Fixed filtering logic with proper typing
  const filteredChairs = chairs.filter((chair) => {
    if (activeFilter === "all") return true

    // Map filter values to actual status values with proper typing
    const statusMap: Record<Exclude<FilterType, "all">, ChairStatus> = {
      available: "Available",
      occupied: "Occupied",
      maintenance: "Under Maintenance",
    }

    return chair.status === statusMap[activeFilter as Exclude<FilterType, "all">]
  })

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Under Maintenance" },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto p-2">
        <Alert className="mb-6 bg-[#5C8E77]/10 border-[#5C8E77]/20">
          <Info className="h-4 w-4 text-[#5C8E77]" />
          <AlertDescription className="text-[#333]">
            Chairs are automatically assigned to students upon confirmed attendance based on procedure needs and chair
            availability.
          </AlertDescription>
        </Alert>

        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-semibold text-[#333]">List of Dental Chairs</CardTitle>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                {filterOptions.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={activeFilter === filter.value ? "default" : "ghost"}
                    size="sm"
                    className={activeFilter === filter.value ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                          {chair.procedures.map((procedure: string) => (
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
