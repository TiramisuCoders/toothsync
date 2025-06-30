"use client"
import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Calendar, RockingChair, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function ClinicianDashboard() {
  // Centralized data - pulling from admin perspective
  const cliniciansLoggedIn = 24
  const availableInstructors = 3
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Track activity completion status
  const [todaysActivities, setTodaysActivities] = useState([
    {
      id: "ACT-001",
      firstName: "Maria",
      lastName: "Santos",
      patientName: "Joanne Joaquin",
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
  ])

  // Clinician information
  const clinicianInfo = {
    firstName: "Maria",
    lastName: "Santos",
    yearLevel: "5th Year",
    section: "A",
    timeIn: "08:15 AM",
    timeOut: hasTimedOut ? "05:30 PM" : null,
  }

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

  // Check if all activities are completed or no activities are in progress
  const canTimeOut =
    todaysActivities.every((activity) => activity.status === "Completed" || activity.status === "Cancelled") ||
    !todaysActivities.some((activity) => activity.status === "In Progress")

  const handleTimeoutRequest = () => {
    setShowTimeoutDialog(true)
  }

  const handleTimeoutConfirm = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setShowTimeoutDialog(false)
      setHasTimedOut(true)

      // Update any remaining activities to appropriate status
      setTodaysActivities((prev) =>
        prev.map((activity) => {
          if (activity.status === "Pending") {
            return { ...activity, status: "Cancelled" }
          }
          if (activity.status === "In Progress") {
            return { ...activity, status: "Incomplete" }
          }
          return activity
        }),
      )

      toast({
        title: "Time Out Successful",
        description: `You have timed out at ${format(new Date(), "h:mm a")}`,
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {greeting}, {clinicianInfo.firstName}!
          </h1>
          <p className="text-gray-500">
            {dayOfWeek}, {formattedDate}
          </p>
          <div className="mt-2">
            <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">
              {clinicianInfo.yearLevel}, Section {clinicianInfo.section}
            </Badge>
          </div>
        </div>

        {!hasTimedOut && (
          <Button onClick={handleTimeoutRequest} className="bg-[#5C8E77] hover:bg-[#406E58]">
            <LogOut className="mr-2 h-4 w-4" /> Time Out
          </Button>
        )}
      </div>

      {/* Time In/Out Information */}
      <Card className="shadow-sm border rounded-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Time In</p>
              <p className="text-lg font-semibold">{clinicianInfo.timeIn}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Time Out</p>
              <p className="text-lg font-semibold">{clinicianInfo.timeOut || "Not recorded yet"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge className={hasTimedOut ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"}>
                {hasTimedOut ? "Timed Out" : "Active"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Available Chairs</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">15</h3>
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
                <h3 className="text-4xl font-bold mt-2 text-gray-800">3</h3>
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
                <p className="text-sm font-medium text-gray-500 uppercase">Clinicians Logged In</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">24</h3>
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
                <p className="text-sm font-medium text-gray-500 uppercase">Today's Activities</p>
                <h3 className="text-4xl font-bold mt-2 text-gray-800">{todaysActivities.length}</h3>
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
                {todaysActivities.map((activity) => (
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
                              : activity.status === "Cancelled"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : activity.status === "Incomplete"
                                  ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
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

      {/* Time Out Dialog */}
      <Dialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Time Out</DialogTitle>
            <DialogDescription>
              {canTimeOut
                ? "You are about to record your time out for today. This action cannot be undone."
                : "Warning: You have activities that are still in progress. If you time out now, they will be marked as incomplete."}
            </DialogDescription>
          </DialogHeader>

          {!canTimeOut && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
              <p className="font-medium">Activities requiring attention:</p>
              <ul className="list-disc pl-5 mt-1">
                {todaysActivities
                  .filter((activity) => activity.status === "In Progress" || activity.status === "Pending")
                  .map((activity) => (
                    <li key={activity.id}>
                      {activity.id} - {activity.procedure} ({activity.status})
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimeoutConfirm} className="bg-[#5C8E77] hover:bg-[#406E58]" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Time Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
