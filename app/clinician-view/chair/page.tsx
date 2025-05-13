"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Sample data for dental chairs
const dentalChairs = [
  {
    id: "CHAIR-001",
    procedure: "Tooth Extraction",
    status: "Occupied",
  },
  {
    id: "CHAIR-002",
    procedure: "Dental Cleaning",
    status: "Available",
  },
  {
    id: "CHAIR-003",
    procedure: "Dental Filling",
    status: "Not Available",
  },
  {
    id: "CHAIR-004",
    procedure: "Root Canal",
    status: "Available",
  },
  {
    id: "CHAIR-005",
    procedure: "Dental Implant",
    status: "Occupied",
  },
]

export default function ClinicianChairs() {
  const [filter, setFilter] = useState("All")

  // Filter chairs based on selected filter
  const filteredChairs = dentalChairs.filter((chair) => {
    if (filter === "All") return true
    return chair.status === filter
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Dental Chairs</h1>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {["All", "Available", "Occupied", "Not Available"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            className={filter === status ? "bg-[#5C8E77] hover:bg-[#4a7c65]" : ""}
            onClick={() => setFilter(status)}
            size="sm"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Chairs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold py-3">Dental Chair ID</TableHead>
                <TableHead className="font-semibold py-3">Procedure</TableHead>
                <TableHead className="font-semibold py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChairs.map((chair) => (
                <TableRow key={chair.id} className="hover:bg-gray-50 border-b">
                  <TableCell className="py-3">{chair.id}</TableCell>
                  <TableCell className="py-3">{chair.procedure}</TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={
                        chair.status === "Available"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : chair.status === "Occupied"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {chair.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
