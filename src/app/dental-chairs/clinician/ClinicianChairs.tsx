"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Chair {
  id: string
  procedures: string[]
  chair_name?: string
  status: "Available" | "Occupied" | "Under Maintenance"
  student: string | null
}

type FilterType = "All" | "Available" | "Occupied" | "Under Maintenance"

const getStatusBadge = (status: Chair["status"]) => {
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

export default function ClinicianChairs() {
  const [filter, setFilter] = useState<FilterType>("All")
  const [chairs, setChairs] = useState<Chair[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

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
        
        return {
          id: String(c?.id ?? c?.chair_id ?? `chair-${i + 1}`),
          chair_name: c?.chair_name,
          procedures: Array.isArray(c?.procedures) ? c.procedures.filter(Boolean) : [],
          status: status,
          student: c?.student ?? null,
        }
      })

      setChairs(normalized)
    } catch (err) {
      console.error("❌ Clinician chairs fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch chairs")
    } finally {
      setLoading(false)
    }
  }

  // Filter chairs based on selected filter
  const filteredChairs = chairs.filter((chair) => {
    if (filter === "All") return true
    return chair.status === filter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dental Chairs</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">List of Chairs</h1>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
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

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {(["All", "Available", "Occupied", "Under Maintenance"] as FilterType[]).map((status) => (
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
                <TableHead className="font-semibold py-3">Chairs</TableHead>
                <TableHead className="font-semibold py-3">Procedures</TableHead>
                <TableHead className="font-semibold py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChairs.length > 0 ? (
                filteredChairs.map((chair) => (
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
                      {getStatusBadge(chair.status)}
                    </TableCell>
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
    </div>
  )
}