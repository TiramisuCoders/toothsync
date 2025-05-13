"use client"

import { User, Users, Calendar, Settings, Bell, ChevronDown, FileText, LayoutDashboard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboard() {
  // Sample data for the dashboard
  const cliniciansLoggedIn = 24
  const availableInstructors = 8
  const availableChairs = 15
  const assignments = [
    {
      id: 1,
      clinician: "Maria Santos",
      chair: "Chair 05",
      instructor: "Dr. Reyes",
      procedure: "Root Canal Treatment",
      status: "In Progress",
    },
    {
      id: 2,
      clinician: "John Dela Cruz",
      chair: "Chair 12",
      instructor: "Dr. Mendoza",
      procedure: "Dental Filling",
      status: "Starting",
    },
    {
      id: 3,
      clinician: "Anna Lim",
      chair: "Chair 03",
      instructor: "Dr. Santos",
      procedure: "Dental Crown",
      status: "In Progress",
    },
    {
      id: 4,
      clinician: "Mark Aquino",
      chair: "Chair 08",
      instructor: "Dr. Reyes",
      procedure: "Teeth Cleaning",
      status: "Completed",
    },
    {
      id: 5,
      clinician: "Sarah Garcia",
      chair: "Chair 10",
      instructor: "Dr. Tan",
      procedure: "Dental Extraction",
      status: "In Progress",
    },
  ]

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-60 bg-green-700 text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2 border-b border-green-600">
          <div className="bg-white rounded-md p-1">
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
              className="text-green-700"
            >
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
              <path d="M12 11v4" />
              <path d="M11 15h2" />
            </svg>
          </div>
          <span className="font-bold text-lg">ToothSync</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-3">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-green-800 text-white"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Calendar
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Appointments
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <Users className="h-5 w-5" />
              Patients
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <div className="flex items-center justify-between w-full">
                Notifications
                <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  2
                </div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Audit Logs
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-green-800 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Settings
              <ChevronDown className="ml-auto h-4 w-4" />
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">{/* Header content can go here */}</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Gon Freecss</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">TOTAL CLINICIANS</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-3xl font-bold">{cliniciansLoggedIn}</div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">AVAILABLE INSTRUCTORS</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-3xl font-bold">{availableInstructors}</div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">AVAILABLE CHAIRS</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-3xl font-bold">{availableChairs}</div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-600"
                  >
                    <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8" />
                    <path d="M18 15l-2-2" />
                    <path d="M18 15l-2 2" />
                    <path d="M5 18h3" />
                    <path d="M2 18h1" />
                  </svg>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">TODAY'S ASSIGNMENTS</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-3xl font-bold">0</div>
                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignments Table */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle className="text-xl font-bold">Today's Assignment - May 04, 2025</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">New Assignment</Button>
                <Button variant="outline">All Assignments</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">APPT ID</TableHead>
                    <TableHead className="font-medium">FIRST NAME</TableHead>
                    <TableHead className="font-medium">LAST NAME</TableHead>
                    <TableHead className="font-medium">DATE</TableHead>
                    <TableHead className="font-medium">TIME SLOT</TableHead>
                    <TableHead className="font-medium">CONTACT NUMBER</TableHead>
                    <TableHead className="font-medium">SERVICES</TableHead>
                    <TableHead className="font-medium">DOCTOR</TableHead>
                    <TableHead className="font-medium">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No appointments scheduled for today.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
