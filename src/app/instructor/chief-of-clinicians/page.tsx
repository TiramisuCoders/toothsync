"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Type definitions moved inline
interface Instructor {
  id: string
  firstName: string
  lastName: string
  gender: string
  status: "Available" | "Not Available"
  email: string
  contactNumber: string
  address: string
  expertise: string[]
  archived?: boolean
}

interface InstructorFormData {
  firstName: string
  lastName: string
  gender: string
  status: string
  email: string
  contactNumber: string
  address: string
  expertise: string[]
}

interface FormErrors {
  firstName?: string
  lastName?: string
  gender?: string
  status?: string
  email?: string
  contactNumber?: string
  address?: string
  expertise?: string
}

interface NotificationState {
  show: boolean
  type: "success" | "error"
  message: string
}

type FilterType = "all" | "available" | "not-available"

export default function InstructorPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentInstructor, setCurrentInstructor] = useState<Instructor | null>(null)
  const [formData, setFormData] = useState<InstructorFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    status: "",
    email: "",
    contactNumber: "",
    address: "",
    expertise: [],
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "success", message: "" })
  const [showArchived, setShowArchived] = useState(false)
  const { toast } = useToast()

  // Sample data for instructors
  const [instructors, setInstructors] = useState<Instructor[]>([])

  // Available dental services/expertise
  const dentalServices = [
    "Endodontics",
    "Extraction",
    "Oral Prophylaxis",
    "Prosthodontics",
    "Restorative",
    "Simulation/Typodont",
  ]

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }

    if (!formData.gender) {
      errors.gender = "Gender is required"
    }

    if (!formData.status) {
      errors.status = "Status is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.contactNumber.trim()) {
      errors.contactNumber = "Contact number is required"
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required"
    }

    if (formData.expertise.length === 0) {
      errors.expertise = "At least one expertise must be selected"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      status: "",
      email: "",
      contactNumber: "",
      address: "",
      expertise: [],
    })
    setFormErrors({})
  }

  // Function to handle edit button click
  const handleEditClick = (instructor: Instructor) => {
    console.log("[v0] Opening edit modal for instructor:", instructor.firstName, instructor.lastName)
    console.log("[v0] Instructor expertise data:", instructor.expertise)

    setCurrentInstructor(instructor)
    setFormData({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      gender: instructor.gender,
      status: instructor.status,
      email: instructor.email,
      contactNumber: instructor.contactNumber,
      address: instructor.address,
      expertise: Array.isArray(instructor.expertise) ? instructor.expertise : [],
    })
    setFormErrors({}) // Clear any previous errors
    setIsEditModalOpen(true)

    console.log("[v0] Form data set with expertise:", Array.isArray(instructor.expertise) ? instructor.expertise : [])
  }

  // Function to update instructor
  const handleUpdateInstructor = async () => {
    if (!currentInstructor) return

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/instructors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentInstructor.id,
          ...formData,
        }),
      })

      if (response.ok) {
        await fetchInstructors() // Refresh the list
        setIsEditModalOpen(false)
        setCurrentInstructor(null)
        resetFormData()
        setFormErrors({})

        toast({
          title: "Success",
          description: `Instructor ${formData.firstName} ${formData.lastName} has been updated successfully.`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to update instructor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating instructor:", error)
      toast({
        title: "Error",
        description: "Failed to update instructor",
        variant: "destructive",
      })
    }
  }

  // Function to add new instructor
  const handleAddInstructor = async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchInstructors() // Refresh the list
        setIsAddModalOpen(false)
        resetFormData()
        setFormErrors({})

        toast({
          title: "Success",
          description: `Instructor ${formData.firstName} ${formData.lastName} has been added successfully.`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to add instructor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding instructor:", error)
      toast({
        title: "Error",
        description: "Failed to add instructor",
        variant: "destructive",
      })
    }
  }

  // Handle form field changes
  const handleInputChange = (field: keyof InstructorFormData, value: string) => {
    setFormData((prev: InstructorFormData) => ({ ...prev, [field]: value }))
  }

  // Handle expertise checkbox changes
  const handleExpertiseChange = (service: string, checked: boolean) => {
    setFormData((prev: InstructorFormData) => ({
      ...prev,
      expertise: checked ? [...prev.expertise, service] : prev.expertise.filter((s: string) => s !== service),
    }))
  }

  // Function to archive/unarchive instructor
  const handleArchiveInstructor = (instructorId: string) => {
    setInstructors(
      instructors.map((instructor: Instructor) =>
        instructor.id === instructorId ? { ...instructor, archived: !instructor.archived } : instructor,
      ),
    )

    const instructor = instructors.find((i) => i.id === instructorId)
    if (instructor) {
      toast({
        title: "Success",
        description: `Instructor ${instructor.firstName} ${instructor.lastName} has been ${instructor.archived ? "unarchived" : "archived"}.`,
      })
    }
  }

  // Filter instructors based on active filter
  const filteredInstructors = instructors.filter((instructor) => {
    // First filter by archived status
    if (showArchived && !instructor.archived) return false
    if (!showArchived && instructor.archived) return false

    // Then filter by availability status
    if (activeFilter === "all") return true
    if (activeFilter === "available") return instructor.status === "Available"
    if (activeFilter === "not-available") return instructor.status === "Not Available"
    return true
  })

  // Handle modal close
  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
    resetFormData()
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setCurrentInstructor(null)
    resetFormData()
  }

  const getFieldError = (field: keyof FormErrors) => {
    return formErrors[field] ? <p className="text-sm text-red-600 mt-1">{formErrors[field]}</p> : null
  }

  // API integration functions
  const fetchInstructors = async () => {
    try {
      console.log("[v0] Fetching instructors from API...")
      const response = await fetch("/api/instructors")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Successfully fetched instructors with expertise:", data)
        const validatedData = data.map((instructor: any) => ({
          ...instructor,
          expertise: Array.isArray(instructor.expertise) ? instructor.expertise : [],
        }))
        setInstructors(validatedData)
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch instructors:", response.status, errorText)
        if (response.status === 500 && errorText.includes("Environment variables missing")) {
          toast({
            title: "Configuration Error",
            description: "Supabase environment variables are not configured. Please add them in Project Settings.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch instructors",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching instructors:", error)
      toast({
        title: "Error",
        description: "Failed to fetch instructors",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchInstructors()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      {/* Information Alert */}
      <Alert className="mb-6 bg-[#5C8E77]/10 border-[#5C8E77]/20">
        <Info className="h-4 w-4 text-[#5C8E77]" />
        <AlertDescription className="text-[#333]">
          Only <span className="font-semibold">Available</span> instructors can be automatically assigned to students
          who confirmed attendance and are assigned to chairs.
        </AlertDescription>
      </Alert>

      {/* Instructors Table */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-semibold text-[#333]">
              {showArchived ? "Archived Instructors" : "Active Instructors"}
            </CardTitle>
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
                variant={activeFilter === "available" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "available" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("available")}
              >
                Available
              </Button>
              <Button
                variant={activeFilter === "not-available" ? "default" : "ghost"}
                size="sm"
                className={activeFilter === "not-available" ? "bg-[#5C8E77] hover:bg-[#406E58]" : ""}
                onClick={() => setActiveFilter("not-available")}
              >
                Not Available
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="text-gray-600"
              >
                {showArchived ? "Hide" : "Show"} Archived
              </Button>
            </div>
          </div>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Instructor
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white border-b border-gray-200">
              <TableRow className="hover:bg-white border-b-0">
                <TableHead className="font-medium text-[#333]">Instructor ID</TableHead>
                <TableHead className="font-medium text-[#333]">First Name</TableHead>
                <TableHead className="font-medium text-[#333]">Last Name</TableHead>
                <TableHead className="font-medium text-[#333]">Gender</TableHead>
                <TableHead className="font-medium text-[#333]">Status</TableHead>
                <TableHead className="font-medium text-[#333]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstructors.length > 0 ? (
                filteredInstructors.map((instructor) => (
                  <TableRow
                    key={instructor.id}
                    className={`hover:bg-gray-50 border-b border-gray-200 ${instructor.archived ? "bg-gray-50 opacity-75" : ""}`}
                  >
                    <TableCell className="font-medium text-[#333]">{instructor.id}</TableCell>
                    <TableCell className="text-[#333]">{instructor.firstName}</TableCell>
                    <TableCell className="text-[#333]">{instructor.lastName}</TableCell>
                    <TableCell className="text-[#333]">{instructor.gender}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {instructor.status === "Available" ? (
                          <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{instructor.status}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {instructor.status}
                          </Badge>
                        )}
                        {instructor.archived && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                          onClick={() => handleEditClick(instructor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${instructor.archived ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
                          onClick={() => handleArchiveInstructor(instructor.id)}
                          title={instructor.archived ? "Unarchive instructor" : "Archive instructor"}
                        >
                          {instructor.archived ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No instructors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Instructor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleAddModalClose}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Add New Instructor</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the instructor details to add them to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="expertise">Service Expertise</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#333]">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      className={`border-gray-300 ${formErrors.firstName ? "border-red-500" : ""}`}
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                    />
                    {getFieldError("firstName")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#333]">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      className={`border-gray-300 ${formErrors.lastName ? "border-red-500" : ""}`}
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                    {getFieldError("lastName")}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[#333]">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger
                        id="gender"
                        className={`border-gray-300 ${formErrors.gender ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldError("gender")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-[#333]">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger
                        id="status"
                        className={`border-gray-300 ${formErrors.status ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Not Available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldError("status")}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333]">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className={`border-gray-300 ${formErrors.email ? "border-red-500" : ""}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  {getFieldError("email")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-[#333]">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactNumber"
                    placeholder="Enter contact number"
                    className={`border-gray-300 ${formErrors.contactNumber ? "border-red-500" : ""}`}
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  />
                  {getFieldError("contactNumber")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#333]">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    className={`border-gray-300 ${formErrors.address ? "border-red-500" : ""}`}
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                  {getFieldError("address")}
                </div>
              </TabsContent>
              <TabsContent value="expertise" className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[#333]">
                    Service Expertise <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-500">
                    Select the dental services this instructor is qualified to supervise. The system will only assign
                    instructors to students if both the instructor is available and the case matches their expertise.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dentalServices.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service}`}
                          checked={formData.expertise.includes(service)}
                          onCheckedChange={(checked) => handleExpertiseChange(service, checked as boolean)}
                        />
                        <Label htmlFor={`service-${service}`} className="text-sm font-normal">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {getFieldError("expertise")}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleAddModalClose} className="border-gray-300 bg-transparent">
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white" onClick={handleAddInstructor}>
              Add Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Instructor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalClose}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg">
          {currentInstructor && (
            <>
              <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Edit Instructor</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Update instructor information for {currentInstructor.firstName} {currentInstructor.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="personal">Personal Information</TabsTrigger>
                    <TabsTrigger value="expertise">Service Expertise</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName" className="text-[#333]">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className={`border-gray-300 ${formErrors.firstName ? "border-red-500" : ""}`}
                        />
                        {getFieldError("firstName")}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName" className="text-[#333]">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className={`border-gray-300 ${formErrors.lastName ? "border-red-500" : ""}`}
                        />
                        {getFieldError("lastName")}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-gender" className="text-[#333]">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                          <SelectTrigger
                            id="edit-gender"
                            className={`border-gray-300 ${formErrors.gender ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {getFieldError("gender")}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-[#333]">
                          Status <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                          <SelectTrigger
                            id="edit-status"
                            className={`border-gray-300 ${formErrors.status ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Not Available">Not Available</SelectItem>
                          </SelectContent>
                        </Select>
                        {getFieldError("status")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-[#333]">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`border-gray-300 ${formErrors.email ? "border-red-500" : ""}`}
                      />
                      {getFieldError("email")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contactNumber" className="text-[#333]">
                        Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-contactNumber"
                        value={formData.contactNumber}
                        onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                        className={`border-gray-300 ${formErrors.contactNumber ? "border-red-500" : ""}`}
                      />
                      {getFieldError("contactNumber")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address" className="text-[#333]">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`border-gray-300 ${formErrors.address ? "border-red-500" : ""}`}
                      />
                      {getFieldError("address")}
                    </div>
                  </TabsContent>
                  <TabsContent value="expertise" className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[#333]">
                        Service Expertise <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-sm text-gray-500">
                        Select the dental services this instructor is qualified to supervise. The system will only
                        assign instructors to students if both the instructor is available and the case matches their
                        expertise.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {dentalServices.map((service) => (
                          <div key={service} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-service-${service}`}
                              checked={formData.expertise.includes(service)}
                              onCheckedChange={(checked) => handleExpertiseChange(service, checked as boolean)}
                            />
                            <Label htmlFor={`edit-service-${service}`} className="text-sm font-normal">
                              {service}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {getFieldError("expertise")}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={handleEditModalClose} className="border-gray-300 bg-transparent">
                  Cancel
                </Button>
                <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white" onClick={handleUpdateInstructor}>
                  Update Instructor
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
