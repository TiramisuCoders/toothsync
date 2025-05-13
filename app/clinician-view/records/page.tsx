"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

// Sample clinician data
const clinicianData = {
  id: "CLIN-001",
  firstName: "Maria",
  lastName: "Santos",
  course: "Doctor of Dental Medicine",
  year: "4th Year",
  assignedChair: "Chair 2",
  instructor: "Doc. Sales",
  email: "maria.santos@example.com",
  contactNumber: "+63 912 345 6789",
}

// Sample activities data
const activitiesData = [
  {
    id: "ACT-001",
    patientName: "Maria Santos",
    chair: "Chair 1",
    procedure: "Tooth Extraction",
    date: "2025-05-09T09:30:00",
    status: "Completed",
  },
  {
    id: "ACT-002",
    patientName: "Pedro Penduko",
    chair: "Chair 3",
    procedure: "Dental Cleaning",
    date: "2025-05-09T11:00:00",
    status: "In Progress",
  },
  {
    id: "ACT-003",
    patientName: "Jose Rizal",
    chair: "Chair 2",
    procedure: "Dental Filling",
    date: "2025-05-09T14:00:00",
    status: "Pending",
  },
  {
    id: "ACT-004",
    patientName: "Andres Bonifacio",
    chair: "Chair 4",
    procedure: "Root Canal",
    date: "2025-05-08T10:15:00",
    status: "Completed",
  },
  {
    id: "ACT-005",
    patientName: "Emilio Aguinaldo",
    chair: "Chair 2",
    procedure: "Dental Implant",
    date: "2025-05-07T13:45:00",
    status: "Completed",
  },
]

// Sample attendance data
const attendanceData = [
  {
    id: "ATT-001",
    timeIn: "2025-05-09T08:30:00",
    timeOut: "2025-05-09T16:30:00",
    chair: "Chair 1",
    procedure: "Tooth Extraction",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-002",
    timeIn: "2025-05-08T08:45:00",
    timeOut: "2025-05-08T16:15:00",
    chair: "Chair 3",
    procedure: "Dental Cleaning",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-003",
    timeIn: "2025-05-07T09:00:00",
    timeOut: "2025-05-07T17:00:00",
    chair: "Chair 2",
    procedure: "Dental Filling",
    sanitized: "Yes",
    status: "Present",
  },
  {
    id: "ATT-004",
    timeIn: "2025-05-06T08:30:00",
    timeOut: "2025-05-06T16:30:00",
    chair: "Chair 4",
    procedure: "Root Canal",
    sanitized: "Yes",
    status: "Present",
  },
]

export default function ClinicianRecords() {
  const [activeTab, setActiveTab] = useState("activities")

  // Function to handle CSV export (mock)
  const handleExportCSV = () => {
    alert("Exporting CSV...")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Records</h1>

      {/* Clinician Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Clinician Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">
                {clinicianData.firstName} {clinicianData.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="font-semibold">{clinicianData.course}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-semibold">{clinicianData.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-semibold">Section A</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{clinicianData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Number</p>
              <p className="font-semibold">{clinicianData.contactNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Activities and Attendance */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Activities Tab Content */}
        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Act ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Chair</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesData.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.id}</TableCell>
                      <TableCell>{activity.patientName}</TableCell>
                      <TableCell>{activity.chair}</TableCell>
                      <TableCell>{activity.procedure}</TableCell>
                      <TableCell>{format(new Date(activity.date), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            activity.status === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : activity.status === "In Progress"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab Content */}
        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Attendance ID</TableHead>
                    <TableHead className="font-semibold">Time In</TableHead>
                    <TableHead className="font-semibold">Time Out</TableHead>
                    <TableHead className="font-semibold">Chair</TableHead>
                    <TableHead className="font-semibold">Procedure</TableHead>
                    <TableHead className="font-semibold">Sanitized</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>{attendance.id}</TableCell>
                      <TableCell>{format(new Date(attendance.timeIn), "h:mm a")}</TableCell>
                      <TableCell>{format(new Date(attendance.timeOut), "h:mm a")}</TableCell>
                      <TableCell>{attendance.chair}</TableCell>
                      <TableCell>{attendance.procedure}</TableCell>
                      <TableCell>{attendance.sanitized}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{attendance.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
