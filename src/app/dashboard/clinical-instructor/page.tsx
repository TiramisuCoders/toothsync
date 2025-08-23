"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, X, Pencil, Users, ArrowUpDown, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Activity {
  id: string
  firstName: string
  lastName: string
  patientName: string
  chair: string
  date: string
  procedure: string
  status: string
}

interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  variant: "complete" | "incomplete" | "availability"
  onConfirm: () => void
}

export default function InstructorDashboard() {
  const [isAvailable, setIsAvailable] = useState(true)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<Activity | null>(null)
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "complete",
    onConfirm: () => {},
  })
  const currentDate = new Date()

  useEffect(() => {
    setFormData(editingActivity)
  }, [editingActivity])

  // Centralized data - pulling from admin perspective
  const cliniciansLoggedIn = 24
  const availableInstructors = 3

  const [todaysActivities, setTodaysActivities] = useState<Activity[]>([
    {
      id: "1",
      firstName: "Maria",
      lastName: "Santos",
      patientName: "Juan Dela Cruz",
      chair: "Chair 05",
      date: "2025-05-10",
      procedure: "Root Canal Treatment",
      status: "Started",
    },
    {
      id: "2",
      firstName: "John",
      lastName: "Dela Cruz",
      patientName: "Ana Reyes",
      chair: "Chair 12",
      date: "2025-05-10",
      procedure: "Dental Filling",
      status: "Not started",
    },
    {
      id: "3",
      firstName: "Anna",
      lastName: "Lim",
      patientName: "Miguel Santos",
      chair: "Chair 03",
      date: "2025-05-10",
      procedure: "Dental Crown",
      status: "Started",
    },
    {
      id: "4",
      firstName: "Mark",
      lastName: "Aquino",
      patientName: "Sofia Reyes",
      chair: "Chair 08",
      date: "2025-05-10",
      procedure: "Teeth Cleaning",
      status: "Completed",
    },
    {
      id: "5",
      firstName: "Sarah",
      lastName: "Garcia",
      patientName: "Luis Tan",
      chair: "Chair 10",
      date: "2025-05-10",
      procedure: "Dental Extraction",
      status: "Incomplete",
    },
  ])

  // Get the greeting based on time of day
  const getGreeting = () => {
    const hour = currentDate.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Function to get status color
  const getStatusColor = (status: string) => {
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleSaveActivity = () => {
    if (!formData) return

    setTodaysActivities((prev) => prev.map((activity) => (activity.id === formData.id ? formData : activity)))
    handleCloseEditModal()
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingActivity(null)
    setFormData(null)
  }

  const handleInputChange = (field: keyof Activity, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const getVariantStyles = (variant: "complete" | "incomplete" | "availability") => {
    switch (variant) {
      case "complete":
        return {
          icon: <Check className="h-6 w-6 text-green-600" />,
          iconBg: "bg-green-50",
          confirmButton: "bg-green-600 hover:bg-green-700",
        }
      case "incomplete":
        return {
          icon: <X className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-50",
          confirmButton: "bg-red-600 hover:bg-red-700",
        }
      case "availability":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          iconBg: "bg-amber-50",
          confirmButton: "bg-amber-600 hover:bg-amber-700",
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-gray-600" />,
          iconBg: "bg-gray-50",
          confirmButton: "bg-gray-600 hover:bg-gray-700",
        }
    }
  }

  const handleCompleteActivity = (activity: Activity) => {
    setConfirmationState({
      isOpen: true,
      title: "Mark as Complete",
      message: `Are you sure you want to mark ${activity.firstName} ${activity.lastName}'s ${activity.procedure} as completed?`,
      confirmText: "Mark Complete",
      variant: "complete",
      onConfirm: () => {
        setTodaysActivities((prev) =>
          prev.map((act) => (act.id === activity.id ? { ...act, status: "Completed" } : act)),
        )
      },
    })
  }

  const handleIncompleteActivity = (activity: Activity) => {
    setConfirmationState({
      isOpen: true,
      title: "Mark as Incomplete",
      message: `Are you sure you want to mark ${activity.firstName} ${activity.lastName}'s ${activity.procedure} as incomplete? This will require additional follow-up.`,
      confirmText: "Mark Incomplete",
      variant: "incomplete",
      onConfirm: () => {
        setTodaysActivities((prev) =>
          prev.map((act) => (act.id === activity.id ? { ...act, status: "Incomplete" } : act)),
        )
      },
    })
  }

  const handleAvailabilityChange = (checked: boolean) => {
    if (!checked && isAvailable) {
      // Turning off availability - show confirmation
      setConfirmationState({
        isOpen: true,
        title: "Turn Off Availability",
        message:
          "Are you sure you want to turn off your availability? You will not receive new clinician assignments until you turn it back on.",
        confirmText: "Turn Off",
        variant: "availability",
        onConfirm: () => setIsAvailable(false),
      })
    } else {
      // Turning on availability - no confirmation needed
      setIsAvailable(checked)
    }
  }

  const closeConfirmationModal = () => {
    setConfirmationState((prev) => ({ ...prev, isOpen: false }))
  }

  const handleConfirmAction = () => {
    confirmationState.onConfirm()
    closeConfirmationModal()
  }

  // Format the date as "Day of week, Month Day, Year"
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const confirmationStyles = getVariantStyles(confirmationState.variant)

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
            onCheckedChange={handleAvailabilityChange}
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
                  <TableCell>
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                        onClick={() => handleEditActivity(activity)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-500 hover:text-green-600"
                        onClick={() => handleCompleteActivity(activity)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => handleIncompleteActivity(activity)}
                      >
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

      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>

          {formData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange("patientName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chair">Chair</Label>
                  <Select value={formData.chair} onValueChange={(value) => handleInputChange("chair", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => (
                        <SelectItem key={i + 1} value={`Chair ${String(i + 1).padStart(2, "0")}`}>
                          Chair {String(i + 1).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure">Procedure</Label>
                <Select value={formData.procedure} onValueChange={(value) => handleInputChange("procedure", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Root Canal Treatment">Root Canal Treatment</SelectItem>
                    <SelectItem value="Dental Filling">Dental Filling</SelectItem>
                    <SelectItem value="Dental Crown">Dental Crown</SelectItem>
                    <SelectItem value="Teeth Cleaning">Teeth Cleaning</SelectItem>
                    <SelectItem value="Dental Extraction">Dental Extraction</SelectItem>
                    <SelectItem value="Dental Implant">Dental Implant</SelectItem>
                    <SelectItem value="Orthodontic Treatment">Orthodontic Treatment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not started">Not started</SelectItem>
                    <SelectItem value="Started">Started</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveActivity} className="bg-black hover:bg-gray-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmationState.isOpen} onOpenChange={closeConfirmationModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${confirmationStyles.iconBg} flex items-center justify-center`}>
                {confirmationStyles.icon}
              </div>
              <DialogTitle className="text-lg font-semibold">{confirmationState.title}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600 leading-relaxed">{confirmationState.message}</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeConfirmationModal}>
              Cancel
            </Button>
            <Button className={confirmationStyles.confirmButton} onClick={handleConfirmAction}>
              {confirmationState.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
