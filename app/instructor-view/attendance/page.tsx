"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function InstructorAttendancePage() {
  const [activeFilter, setActiveFilter] = useState("all")

  // Sample data for attendance records - only showing present clinicians
  const [attendanceRecords] = useState([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      timeIn: "08:15 AM",
      timeOut: "05:30 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      timeIn: "07:55 AM",
      timeOut: "04:30 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      timeIn: "09:10 AM",
      timeOut: "06:00 PM",
      date: "2025-05-04",
      sanitize: "Yes",
      status: "Present",
    },
  ])

  // Function to get status badge color
  const getStatusBadge = (status) => {
    return <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{status}</Badge>
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
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
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
