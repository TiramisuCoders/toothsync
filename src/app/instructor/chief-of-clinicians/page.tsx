"use client"

import { useState } from "react"
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

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function InstructorPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentInstructor, setCurrentInstructor] = useState(null)
  const [isReportsOpen, setIsReportsOpen] = useState(false)

  // Sample data for instructors
  const [instructors, setInstructors] = useState([
    {
      id: "I2024-001",
      firstName: "Dr. Maria",
      lastName: "Reyes",
      gender: "Female",
      status: "Available",
      email: "maria.reyes@example.com",
      contactNumber: "+63 912 345 6789",
      address: "123 Rizal Avenue, Manila",
      expertise: ["Extraction", "Root Canal", "General Dentistry"],
    },
    {
      id: "I2024-002",
      firstName: "Dr. Juan",
      lastName: "Mendoza",
      gender: "Male",
      status: "Available",
      email: "juan.mendoza@example.com",
      contactNumber: "+63 917 123 4567",
      address: "456 Mabini Street, Quezon City",
      expertise: ["Dental Filling", "Teeth Cleaning", "General Dentistry"],
    },
    {
      id: "I2024-003",
      firstName: "Dr. Anna",
      lastName: "Santos",
      gender: "Female",
      status: "Not Available",
      email: "anna.santos@example.com",
      contactNumber: "+63 918 765 4321",
      address: "789 Bonifacio Avenue, Makati",
      expertise: ["Dental Crown", "Root Canal", "Orthodontics"],
    },
    {
      id: "I2024-004",
      firstName: "Dr. Carlos",
      lastName: "Tan",
      gender: "Male",
      status: "Available",
      email: "carlos.tan@example.com",
      contactNumber: "+63 919 876 5432",
      address: "321 Aguinaldo Street, Pasig",
      expertise: ["Extraction", "Dental Filling", "Teeth Cleaning"],
    },
    {
      id: "I2024-005",
      firstName: "Dr. Sofia",
      lastName: "Garcia",
      gender: "Female",
      status: "Not Available",
      email: "sofia.garcia@example.com",
      contactNumber: "+63 915 432 1098",
      address: "654 Luna Road, Mandaluyong",
      expertise: ["Orthodontics", "Dental Crown", "General Dentistry"],
    },
  ])

  // Available dental services/expertise
  const dentalServices = [
    "Extraction",
    "Root Canal",
    "Dental Filling",
    "Dental Crown",
    "Teeth Cleaning",
    "Orthodontics",
    "General Dentistry",
    "Periodontics",
    "Prosthodontics",
  ]

  // Function to handle edit button click
  const handleEditClick = (instructor) => {
    setCurrentInstructor(instructor)
    setIsEditModalOpen(true)
  }

  // Function to update instructor
  const handleUpdateInstructor = (updatedInstructor) => {
    setInstructors(
      instructors.map((instructor) => (instructor.id === updatedInstructor.id ? updatedInstructor : instructor)),
    )
    setIsEditModalOpen(false)
  }

  // Function to add new instructor
  const handleAddInstructor = (newInstructor) => {
    setInstructors([...instructors, { ...newInstructor, id: `I2024-00${instructors.length + 1}` }])
    setIsAddModalOpen(false)
  }

  // Filter instructors based on active filter
  const filteredInstructors = instructors.filter((instructor) => {
    if (activeFilter === "all") return true
    if (activeFilter === "available") return instructor.status === "Available"
    if (activeFilter === "not-available") return instructor.status === "Not Available"
    return true
  })

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
            <CardTitle className="text-xl font-semibold text-[#333]">List of Instructors</CardTitle>
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
                  <TableRow key={instructor.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="font-medium text-[#333]">{instructor.id}</TableCell>
                    <TableCell className="text-[#333]">{instructor.firstName}</TableCell>
                    <TableCell className="text-[#333]">{instructor.lastName}</TableCell>
                    <TableCell className="text-[#333]">{instructor.gender}</TableCell>
                    <TableCell>
                      {instructor.status === "Available" ? (
                        <Badge className="bg-[#5C8E77] hover:bg-[#406E58]">{instructor.status}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          {instructor.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[#5C8E77] hover:bg-[#e6f7eb]"
                        onClick={() => handleEditClick(instructor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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
                      First Name
                    </Label>
                    <Input id="firstName" placeholder="Enter first name" className="border-gray-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#333]">
                      Last Name
                    </Label>
                    <Input id="lastName" placeholder="Enter last name" className="border-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[#333]">
                      Gender
                    </Label>
                    <Select>
                      <SelectTrigger id="gender" className="border-gray-300">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-[#333]">
                      Status
                    </Label>
                    <Select>
                      <SelectTrigger id="status" className="border-gray-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="not-available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#333]">
                    Email
                  </Label>
                  <Input id="email" type="email" placeholder="Enter email address" className="border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-[#333]">
                    Contact Number
                  </Label>
                  <Input id="contactNumber" placeholder="Enter contact number" className="border-gray-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[#333]">
                    Address
                  </Label>
                  <Input id="address" placeholder="Enter address" className="border-gray-300" />
                </div>
              </TabsContent>
              <TabsContent value="expertise" className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[#333]">Service Expertise</Label>
                  <p className="text-sm text-gray-500">
                    Select the dental services this instructor is qualified to supervise. The system will only assign
                    instructors to students if both the instructor is available and the case matches their expertise.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dentalServices.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox id={`service-${service}`} />
                        <Label htmlFor={`service-${service}`} className="text-sm font-normal">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white">Add Instructor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Instructor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
                          First Name
                        </Label>
                        <Input
                          id="edit-firstName"
                          defaultValue={currentInstructor.firstName}
                          onChange={(e) => setCurrentInstructor({ ...currentInstructor, firstName: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName" className="text-[#333]">
                          Last Name
                        </Label>
                        <Input
                          id="edit-lastName"
                          defaultValue={currentInstructor.lastName}
                          onChange={(e) => setCurrentInstructor({ ...currentInstructor, lastName: e.target.value })}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-gender" className="text-[#333]">
                          Gender
                        </Label>
                        <Select
                          defaultValue={currentInstructor.gender.toLowerCase()}
                          onValueChange={(value) =>
                            setCurrentInstructor({
                              ...currentInstructor,
                              gender: value.charAt(0).toUpperCase() + value.slice(1),
                            })
                          }
                        >
                          <SelectTrigger id="edit-gender" className="border-gray-300">
                            <SelectValue placeholder={currentInstructor.gender} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-[#333]">
                          Status
                        </Label>
                        <Select
                          defaultValue={currentInstructor.status.toLowerCase().replace(" ", "-")}
                          onValueChange={(value) =>
                            setCurrentInstructor({
                              ...currentInstructor,
                              status: value === "available" ? "Available" : "Not Available",
                            })
                          }
                        >
                          <SelectTrigger id="edit-status" className="border-gray-300">
                            <SelectValue placeholder={currentInstructor.status} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="not-available">Not Available</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-[#333]">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        defaultValue={currentInstructor.email}
                        onChange={(e) => setCurrentInstructor({ ...currentInstructor, email: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contactNumber" className="text-[#333]">
                        Contact Number
                      </Label>
                      <Input
                        id="edit-contactNumber"
                        defaultValue={currentInstructor.contactNumber}
                        onChange={(e) => setCurrentInstructor({ ...currentInstructor, contactNumber: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address" className="text-[#333]">
                        Address
                      </Label>
                      <Input
                        id="edit-address"
                        defaultValue={currentInstructor.address}
                        onChange={(e) => setCurrentInstructor({ ...currentInstructor, address: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="expertise" className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[#333]">Service Expertise</Label>
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
                              checked={currentInstructor.expertise.includes(service)}
                              onCheckedChange={(checked) => {
                                const updatedExpertise = checked
                                  ? [...currentInstructor.expertise, service]
                                  : currentInstructor.expertise.filter((s) => s !== service)
                                setCurrentInstructor({
                                  ...currentInstructor,
                                  expertise: updatedExpertise,
                                })
                              }}
                            />
                            <Label htmlFor={`edit-service-${service}`} className="text-sm font-normal">
                              {service}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
                <Button
                  className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
                  onClick={() => handleUpdateInstructor(currentInstructor)}
                >
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