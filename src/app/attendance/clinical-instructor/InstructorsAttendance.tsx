"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface Record {
  id: string
  firstName: string
  lastName: string
  timeIn: string
  timeOut: string
  date: string
  sanitize: string
  status: string
}

export default function InstructorAttendance() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [attendanceRecords, setAttendanceRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch attendance data when component mounts
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Using existing clerk endpoint since data is the same
        const response = await fetch('/api/attendance/instructors', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setAttendanceRecords(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch attendance data')
        }
      } catch (err) {
        console.error('Error fetching attendance:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  // Filter records based on active filter
  const filteredRecords = activeFilter === "today" 
    ? attendanceRecords.filter(record => {
        const recordDate = new Date(record.date).toDateString()
        const today = new Date().toDateString()
        return recordDate === today
      })
    : attendanceRecords

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{status}</Badge>
  }

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-gray-500">
            Loading attendance records...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="text-center py-12 text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Attendance Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">Present Clinicians</CardTitle>
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
                variant={activeFilter === "today" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "today" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("today")}
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Attendance ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Time In</TableHead>
                <TableHead className="font-medium text-[#333]">Time Out</TableHead>
                <TableHead className="font-medium text-[#333]">Date</TableHead>
                <TableHead className="font-medium text-[#333]">Sanitized</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{record.id}</TableCell>
                    <TableCell className="text-[#333]">{record.firstName}</TableCell>
                    <TableCell className="text-[#333]">{record.lastName}</TableCell>
                    <TableCell className="text-[#333]">{record.timeIn}</TableCell>
                    <TableCell className="text-[#333]">{record.timeOut}</TableCell>
                    <TableCell className="text-[#333]">{record.date}</TableCell>
                    <TableCell className="text-[#333]">{record.sanitize}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}