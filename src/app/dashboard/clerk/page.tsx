"use client"

import { useState } from "react"
import { Calendar, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ClerkDashboard() {
  // Centralized data - pulling from admin perspective
  const cliniciansLoggedIn = 24
  const availableInstructors = 3
  const availableChairs = 15 // Added declaration for availableChairs
  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      firstName: "Maria",
      lastName: "Santos",
      timeIn: "08:30 AM",
      timeOut: "",
      date: "2025-05-10",
      procedure: "Root Canal Treatment",
      sanitized: "No",
      status: "Pending",
    },
    {
      id: 2,
      firstName: "John",
      lastName: "Dela Cruz",
      timeIn: "08:45 AM",
      timeOut: "",
      date: "2025-05-10",
      procedure: "Dental Filling",
      sanitized: "Yes",
      status: "Pending",
    },
    {
      id: 3,
      firstName: "Anna",
      lastName: "Reyes",
      timeIn: "09:00 AM",
      timeOut: "",
      date: "2025-05-10",
      procedure: "Teeth Cleaning",
      sanitized: "No",
      status: "Pending",
    },
  ])

  const handleSanitizedChange = (id: number, value: string) => {
    setAttendanceData(attendanceData.map((item) => (item.id === id ? { ...item, sanitized: value } : item)))
  }

  const handleStatusChange = (id: number, status: string) => {
    setAttendanceData(attendanceData.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  // Get current date
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  const formattedDate = today.toLocaleDateString("en-US", options)

  // Format for greeting header
  const day = today.toLocaleDateString("en-US", { weekday: "long" })
  const month = today.toLocaleDateString("en-US", { month: "long" })
  const date = today.getDate()
  const year = today.getFullYear()
  const formattedGreetingDate = `${day}, ${month} ${date}, ${year}`

  // Get time of day for greeting
  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon"
  } else if (hour >= 18) {
    greeting = "Good evening"
  }

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">{greeting}, Clerk!</h1>
        <p className="text-gray-500">{formattedGreetingDate}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border rounded-lg overflow-hidden">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium uppercase text-gray-500">PENDING ATTENDANCE</p>
              <p className="text-3xl font-semibold mt-1">3</p>
              <p className="text-sm text-gray-500">To approve</p>
            </div>
            <div className="h-12 w-12 bg-[#e6f7eb] rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#5C8E77]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border rounded-lg overflow-hidden">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium uppercase text-gray-500">AVAILABLE CHAIRS</p>
              <p className="text-3xl font-semibold mt-1">{availableChairs}</p>
              <p className="text-sm text-gray-500">Ready for use</p>
            </div>
            <div className="h-12 w-12 bg-[#e6f7eb] rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-[#5C8E77]"
              >
                <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                <path d="M5 18v2" />
                <path d="M19 18v2" />
              </svg>
            </div>
          </CardContent>
        </Card>
        <Card className="border rounded-lg overflow-hidden">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium uppercase text-gray-500">CLINICIANS OCCUPYING</p>
              <p className="text-3xl font-semibold mt-1">{cliniciansLoggedIn}</p>
              <p className="text-sm text-gray-500">Chairs in use</p>
            </div>
            <div className="h-12 w-12 bg-[#e6f7eb] rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-[#5C8E77]"
              >
                <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                <path d="M5 18v2" />
                <path d="M19 18v2" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance Queue */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Today's Attendance Queue</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="py-3 px-4 font-medium text-gray-700">Attendance ID</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">First Name</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Last Name</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Time In</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Time Out</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Procedure</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Sanitize</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Status</TableHead>
              <TableHead className="py-3 px-4 font-medium text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((attendance) => (
              <TableRow key={attendance.id} className="border-b last:border-0">
                <TableCell className="py-3 px-4">{attendance.id}</TableCell>
                <TableCell className="py-3 px-4">{attendance.firstName}</TableCell>
                <TableCell className="py-3 px-4">{attendance.lastName}</TableCell>
                <TableCell className="py-3 px-4">{attendance.timeIn}</TableCell>
                <TableCell className="py-3 px-4">{attendance.timeOut || "-"}</TableCell>
                <TableCell className="py-3 px-4">{attendance.procedure}</TableCell>
                <TableCell className="py-3 px-4">
                  <Select
                    value={attendance.sanitized}
                    onValueChange={(value) => handleSanitizedChange(attendance.id, value)}
                  >
                    <SelectTrigger className="w-[80px] h-8 border-gray-200 bg-white text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div
                    className={`px-3 py-1 rounded-full text-sm inline-flex items-center justify-center font-medium ${
                      attendance.status === "Present"
                        ? "bg-[#5C8E77] text-white"
                        : "bg-white text-[#F59E0B] border border-[#F59E0B]"
                    }`}
                  >
                    {attendance.status}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      disabled={attendance.sanitized !== "Yes"}
                      onClick={() => handleStatusChange(attendance.id, "Present")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => handleStatusChange(attendance.id, "Absent")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}