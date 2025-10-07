"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Plus, Edit, Trash2, Users, MapPin, AlertCircle } from "lucide-react"

interface ScheduleSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  location: string
  maxStudents: number | null // Allow null for unlimited capacity
  currentStudents: number
  status: "available" | "full" | "unavailable"
  type: "clinical" | "lecture" | "consultation"
}

interface Availability {
  id: string
  date: string
  status: "available" | "unavailable" | "partial"
  reason?: string
  slots: string[]
}

export default function InstructorSchedulePage() {
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      id: "1",
      day: "Monday",
      startTime: "08:00",
      endTime: "12:00",
      location: "Clinic A",
      maxStudents: 8,
      currentStudents: 6,
      status: "available",
      type: "clinical",
    },
    {
      id: "2",
      day: "Monday",
      startTime: "13:00",
      endTime: "17:00",
      location: "Clinic B",
      maxStudents: null, // Example of unlimited capacity
      currentStudents: 10,
      status: "available",
      type: "clinical",
    },
    {
      id: "3",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "11:00",
      location: "Room 201",
      maxStudents: 30,
      currentStudents: 25,
      status: "available",
      type: "lecture",
    },
    {
      id: "4",
      day: "Wednesday",
      startTime: "14:00",
      endTime: "16:00",
      location: "Office",
      maxStudents: 1,
      currentStudents: 0,
      status: "available",
      type: "consultation",
    },
    {
      id: "5",
      day: "Thursday",
      startTime: "08:00",
      endTime: "12:00",
      location: "Clinic C",
      maxStudents: 8,
      currentStudents: 0,
      status: "unavailable",
      type: "clinical",
    },
  ])

  const [availability, setAvailability] = useState<Availability[]>([
    {
      id: "1",
      date: "2024-09-20",
      status: "available",
      slots: ["1", "2"],
    },
    {
      id: "2",
      date: "2024-09-21",
      status: "unavailable",
      reason: "Medical Conference",
      slots: [],
    },
    {
      id: "3",
      date: "2024-09-22",
      status: "partial",
      reason: "Morning only",
      slots: ["3"],
    },
  ])

  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [isAddingAvailability, setIsAddingAvailability] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [isEditingSlot, setIsEditingSlot] = useState(false)

  const [formData, setFormData] = useState({
    day: "",
    type: "",
    startTime: "",
    endTime: "",
    location: "",
    maxStudents: "",
    hasUnlimitedCapacity: false,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "full":
        return "bg-blue-100 text-blue-800"
      case "unavailable":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "clinical":
        return "bg-primary/10 text-primary"
      case "lecture":
        return "bg-blue-100 text-blue-700"
      case "consultation":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot)
    setFormData({
      day: slot.day.toLowerCase(),
      type: slot.type,
      startTime: slot.startTime,
      endTime: slot.endTime,
      location: slot.location,
      maxStudents: slot.maxStudents?.toString() || "",
      hasUnlimitedCapacity: slot.maxStudents === null,
    })
    setIsEditingSlot(true)
  }

  const handleSaveSlot = () => {
    if (editingSlot) {
      const updatedSlots = scheduleSlots.map((slot) =>
        slot.id === editingSlot.id
          ? {
              ...slot,
              day: formData.day.charAt(0).toUpperCase() + formData.day.slice(1),
              type: formData.type as "clinical" | "lecture" | "consultation",
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location,
              maxStudents: formData.hasUnlimitedCapacity ? null : Number.parseInt(formData.maxStudents) || 0,
            }
          : slot,
      )
      setScheduleSlots(updatedSlots)
    }
    setIsEditingSlot(false)
    setEditingSlot(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      day: "",
      type: "",
      startTime: "",
      endTime: "",
      location: "",
      maxStudents: "",
      hasUnlimitedCapacity: false,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">Manage your availability and teaching schedule</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingSlot} onOpenChange={setIsAddingSlot}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Schedule Slot</DialogTitle>
                <DialogDescription>Create a new recurring schedule slot for your teaching activities</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day of Week</Label>
                    <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day.toLowerCase()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Session Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinical">Clinical Session</SelectItem>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                {(formData.type === "lecture" || formData.type === "clinical") && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Clinic A, Room 201"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unlimited"
                      checked={formData.hasUnlimitedCapacity}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasUnlimitedCapacity: checked as boolean })
                      }
                    />
                    <Label htmlFor="unlimited">Unlimited capacity (no student limit)</Label>
                  </div>
                  {!formData.hasUnlimitedCapacity && (
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Maximum Students</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        placeholder="8"
                        value={formData.maxStudents}
                        onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingSlot(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingSlot(false)
                      resetForm()
                    }}
                  >
                    Add Schedule Slot
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditingSlot} onOpenChange={setIsEditingSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule Slot</DialogTitle>
            <DialogDescription>Update your schedule slot details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-day">Day of Week</Label>
                <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day.toLowerCase()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Session Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clinical Session</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            {(formData.type === "lecture" || formData.type === "clinical") && (
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  placeholder="e.g., Clinic A, Room 201"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-unlimited"
                  checked={formData.hasUnlimitedCapacity}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasUnlimitedCapacity: checked as boolean })}
                />
                <Label htmlFor="edit-unlimited">Unlimited capacity (no student limit)</Label>
              </div>
              {!formData.hasUnlimitedCapacity && (
                <div className="space-y-2">
                  <Label htmlFor="edit-maxStudents">Maximum Students</Label>
                  <Input
                    id="edit-maxStudents"
                    type="number"
                    placeholder="8"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingSlot(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSlot}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="availability">Availability Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule Overview
                </CardTitle>
                <CardDescription>Your recurring weekly teaching schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map((day) => {
                    const daySlots = scheduleSlots.filter((slot) => slot.day === day)
                    return (
                      <div key={day} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">{day}</h3>
                        {daySlots.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No scheduled sessions</p>
                        ) : (
                          <div className="space-y-2">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                  {(slot.type === "lecture" || slot.type === "clinical") && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{slot.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {slot.maxStudents === null
                                        ? `${slot.currentStudents} students (unlimited)`
                                        : `${slot.currentStudents}/${slot.maxStudents} students`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getTypeColor(slot.type)}>{slot.type}</Badge>
                                  <Badge className={getStatusColor(slot.status)}>{slot.status}</Badge>
                                  <Button size="sm" variant="ghost" onClick={() => handleEditSlot(slot)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Availability Management
                </CardTitle>
                <CardDescription>Set your availability for specific dates and manage exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Upcoming Availability</h3>
                  <Dialog open={isAddingAvailability} onOpenChange={setIsAddingAvailability}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Set Availability
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Availability</DialogTitle>
                        <DialogDescription>Update your availability for specific dates</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Availability Status</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="unavailable">Unavailable</SelectItem>
                              <SelectItem value="partial">Partially Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason (Optional)</Label>
                          <Input id="reason" placeholder="e.g., Conference, Medical Leave" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddingAvailability(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setIsAddingAvailability(false)}>Save Availability</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-3">
                  {availability.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{new Date(item.date).toLocaleDateString()}</span>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        {item.reason && <span className="text-sm text-muted-foreground">({item.reason})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
