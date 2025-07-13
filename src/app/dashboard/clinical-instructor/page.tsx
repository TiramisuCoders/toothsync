"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil, Users, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function InstructorDashboard() {
  const [isAvailable, setIsAvailable] = useState(true)
  const currentDate = new Date()

  // Centralized data - pulling from admin perspective
  const cliniciansLoggedIn = 24
  const availableInstructors = 3
  const todaysActivities = [
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      patientName: "Juan Dela Cruz",
      chair: "Chair 05",
      date: "May 10, 2025",
      procedure: "Root Canal Treatment",
      status: "Started",
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      patientName: "Ana Reyes",
      chair: "Chair 12",
      date: "May 10, 2025",
      procedure: "Dental Filling",
      status: "Not started",
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      patientName: "Miguel Santos",
      chair: "Chair 03",
      date: "May 10, 2025",
      procedure: "Dental Crown",
      status: "Started",
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      patientName: "Sofia Reyes",
      chair: "Chair 08",
      date: "May 10, 2025",
      procedure: "Teeth Cleaning",
      status: "Completed",
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      patientName: "Luis Tan",
      chair: "Chair 10",
      date: "May 10, 2025",
      procedure: "Dental Extraction",
      status: "Incomplete",
    },
  ]

  // Format the date as "Day of week, Month Day, Year"
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Get the greeting based on time of day
  const getGreeting = () => {
    const hour = currentDate.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Started":
        return "bg-[#5C8E77]/10 text-[#5C8E77]"
      case "Completed":
        return "bg-blue-50 text-blue-700"
      case "Not started":
        return "bg-yellow-50 text-yellow-700"
      case "Incomplete":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">{`${getGreeting()}, Doc. Sales!`}</h1>
        <p className="text-gray-500">{formattedDate}</p>
      </div>

      {/* Instructor Availability */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-1">Instructor Availability</h2>
            <p className="text-gray-500">
              Toggle your availability to be assigned to clinicians. If ON, the system can auto-assign clinicians.
            </p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
            className="scale-125 data-[state=checked]:bg-black"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Assigned Clinicians</h3>
                <p className="text-4xl font-semibold mt-1">{cliniciansLoggedIn}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Graded Clinicians</h3>
                <p className="text-4xl font-semibold mt-1">8</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Not Yet Graded</h3>
                <p className="text-4xl font-semibold mt-1">4</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <X className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activities */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <CardTitle className="text-xl font-semibold">Today's Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium">
                  <div className="flex items-center">
                    Act ID
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="font-medium">First Name</TableHead>
                <TableHead className="font-medium">Last Name</TableHead>
                <TableHead className="font-medium">Patient Name</TableHead>
                <TableHead className="font-medium">Chair</TableHead>
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Procedure</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysActivities.map((activity) => (
                <TableRow key={activity.id} className="border-b">
                  <TableCell className="font-medium">{activity.id}</TableCell>
                  <TableCell>{activity.firstName}</TableCell>
                  <TableCell>{activity.lastName}</TableCell>
                  <TableCell>{activity.patientName}</TableCell>
                  <TableCell>{activity.chair}</TableCell>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>{activity.procedure}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm inline-flex items-center justify-center font-medium ${getStatusColor(
                        activity.status,
                      )}`}
                    >
                      {activity.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-green-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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