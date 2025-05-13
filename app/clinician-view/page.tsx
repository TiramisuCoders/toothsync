"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Activity, Calendar, RockingChair } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Sample data for today's activities
const todayActivities = [
  {
    id: "ACT-001",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Maria Santos",
    chair: "Chair 1",
    date: "2025-05-09T09:30:00",
    procedure: "Tooth Extraction",
    status: "Completed",
  },
  {
    id: "ACT-002",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Pedro Penduko",
    chair: "Chair 3",
    date: "2025-05-09T11:00:00",
    procedure: "Dental Cleaning",
    status: "In Progress",
  },
  {
    id: "ACT-003",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Jose Rizal",
    chair: "Chair 2",
    date: "2025-05-09T14:00:00",
    procedure: "Dental Filling",
    status: "Pending",
  },
]

export default function ClinicianDashboard() {
  const [availableChairs] = useState(5)
  const [instructorsOnDuty] = useState(3)
  const [chairsInUse] = useState(2)

  // Get current date for greeting
  const today = new Date()
  const dayOfWeek = format(today, "EEEE")
  const formattedDate = format(today, "MMMM d, yyyy")

  // Determine greeting based on time of day
  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17) {
    greeting = "Good evening"
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{greeting}, Maria!</h1>
        <p className="text-gray-500">
          {dayOfWeek}, {formattedDate}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Available Chairs</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{availableChairs}</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <RockingChair className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Instructors On Duty</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{instructorsOnDuty}</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <Users className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Chairs Currently Used</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{chairsInUse}</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <Activity className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Today's Activities</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">3</h3>
              </div>
              <div className="bg-[#e6f7eb] p-4 rounded-full">
                <Calendar className="h-6 w-6 text-[#5C8E77]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activities Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Activities</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Act ID</TableHead>
                  <TableHead className="font-semibold">First Name</TableHead>
                  <TableHead className="font-semibold">Last Name</TableHead>
                  <TableHead className="font-semibold">Patient Name</TableHead>
                  <TableHead className="font-semibold">Chair</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Procedure</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.id}</TableCell>
                    <TableCell>{activity.firstName}</TableCell>
                    <TableCell>{activity.lastName}</TableCell>
                    <TableCell>{activity.patientName}</TableCell>
                    <TableCell>{activity.chair}</TableCell>
                    <TableCell>{format(new Date(activity.date), "h:mm a")}</TableCell>
                    <TableCell>{activity.procedure}</TableCell>
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
      </div>
    </div>
  )
}
