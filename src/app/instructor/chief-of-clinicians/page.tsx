//app/instructor/chief-of-clinicians/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Edit } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface Instructor {
  id: string
  firstName: string
  lastName: string
  gender: string
  status: "Available" | "Not Available" | "For Approval"
  email: string
  contactNumber: string
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
  expertise: string[]
}

interface FormErrors {
  firstName?: string
  lastName?: string
  gender?: string
  status?: string
  email?: string
  contactNumber?: string
  expertise?: string
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
    expertise: [],
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showArchived, setShowArchived] = useState(false)
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [instructors, setInstructors] = useState<Instructor[]>([])

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

    if (formData.expertise.length === 0) {
      errors.expertise = "At least one expertise must be selected"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      status: "",
      email: "",
      contactNumber: "",
      expertise: [],
    })
    setFormErrors({})
  }

  const handleEditClick = (instructor: Instructor) => {
    setCurrentInstructor(instructor)
    setOriginalStatus(instructor.status)
    setFormData({
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      gender: instructor.gender,
      status: instructor.status,
      email: instructor.email,
      contactNumber: instructor.contactNumber,
      expertise: instructor.expertise,
    })
    setIsEditModalOpen(true)
  }

  const handleStatusChange = (newStatus: string) => {
    if (isEditModalOpen && originalStatus !== newStatus) {
      setPendingStatusChange(newStatus)
      setShowStatusConfirmation(true)
    } else {
      setFormData((prev) => ({ ...prev, status: newStatus }))
    }
  }

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      setFormData((prev) => ({ ...prev, status: pendingStatusChange }))
      setOriginalStatus(pendingStatusChange)
    }
    setShowStatusConfirmation(false)
    setPendingStatusChange(null)
  }

  const cancelStatusChange = () => {
    setShowStatusConfirmation(false)
    setPendingStatusChange(null)
  }

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
      setLoading(true)
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
        await fetchInstructors()
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
    } finally {
      setLoading(false)
    }
  }

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
      setLoading(true)
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchInstructors()
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
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InstructorFormData, value: string) => {
    setFormData((prev: InstructorFormData) => ({ ...prev, [field]: value }))
  }

  const handleExpertiseChange = (service: string, checked: boolean) => {
    setFormData((prev: InstructorFormData) => ({
      ...prev,
      expertise: checked ? [...prev.expertise, service] : prev.expertise.filter((s: string) => s !== service),
    }))
  }

  const handleArchiveInstructor = (instructorId: string) => {
    setInstructors(
      instructors.map((instructor: Instructor) =>
        instructor.id === instructorId ? { ...instructor, archived: !instructor.archived } : instructor,
      ),
    )

    const result = await response.json()
    console.log(`${action} response:`, result)

    if (response.ok) {
      await fetchInstructors() // Refresh the list
      toast({
        title: "Success",
        description: `Instructor ${instructor.firstName} ${instructor.lastName} has been ${action}d.`,
      })
    } else {
      toast({
        title: "Error",
        description: result.message || `Failed to ${action} instructor`,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("Error archiving instructor:", error)
    toast({
      title: "Error",
      description: "Failed to archive instructor",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}

  const filteredInstructors = instructors.filter((instructor) => {
    if (showArchived && !instructor.archived) return false
    if (!showArchived && instructor.archived) return false

    if (activeFilter === "all") return true
    if (activeFilter === "available") return instructor.status === "Available"
    if (activeFilter === "not-available") return instructor.status === "Not Available"
    return true
  })

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

  const fetchInstructors = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/instructors")
      if (response.ok) {
        const data = await response.json()
        setInstructors(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch instructors",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching instructors:", error)
      toast({
        title: "Error",
        description: "Failed to fetch instructors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstructors()
    
    // Show info toast when page loads
    toast({
      title: "Assignment Information",
      description: "Only Available instructors can be automatically assigned to students who confirmed attendance and are assigned to chairs.",
      duration: 5000,
    })
  }, [])

  if (loading && instructors.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
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
                {showArchived ? "Show Active" : "Show Archived"}
              </Button>
            </div>
          </div>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
            disabled={loading}
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
                        ) : instructor.status === "For Approval" ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            {instructor.status}
                          </Badge>
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
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${instructor.archived ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
                          onClick={() => handleArchiveInstructor(instructor)}
                          disabled={loading}
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
                    {showArchived ? "No archived instructors found." : "No instructors found."}
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
                        <SelectItem value="For Approval">For Approval</SelectItem>
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
              </TabsContent>
              <TabsContent value="expertise" className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[#333]">
                    Service Expertise <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-500">
                    Select the dental services this instructor is qualified to supervise.
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
            <Button 
              className="bg-[#5C8E77] hover:bg-[#406E58] text-white" 
              onClick={handleAddInstructor}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Instructor"}
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
                        <Select value={formData.status} onValueChange={handleStatusChange}>
                          <SelectTrigger
                            id="edit-status"
                            className={`border-gray-300 ${formErrors.status ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Not Available">Not Available</SelectItem>
                            <SelectItem value="For Approval">For Approval</SelectItem>
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
                  </TabsContent>
                  <TabsContent value="expertise" className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[#333]">
                        Service Expertise <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-sm text-gray-500">
                        Select the dental services this instructor is qualified to supervise.
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
                <Button 
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white" 
                  onClick={handleUpdateInstructor}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Instructor"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showStatusConfirmation} onOpenChange={setShowStatusConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update {formData.firstName}'s status? This change may affect their assigned
              chairs and procedures, and could impact student assignments and scheduling.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} className="bg-[#5C8E77] hover:bg-[#406E58] text-white">
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}