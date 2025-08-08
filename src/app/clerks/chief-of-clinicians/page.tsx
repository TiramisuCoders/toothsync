"use client"

import { useState } from "react"
import { Plus, Edit, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Clerk {
  id: string
  firstName: string
  lastName: string
  email: string
  year: string
  section: string
  status: "On Duty" | "Not On Duty"
  archived?: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  year?: string
  section?: string
  status?: string
}

export default function ClerksPage() {
  const [clerks, setClerks] = useState<Clerk[]>([
    {
      id: "CLK001",
      firstName: "John",
      lastName: "Dela Cruz",
      email: "john.delacruz@domc.edu.ph",
      year: "3rd Year",
      section: "A",
      status: "On Duty",
      archived: false,
    },
    {
      id: "CLK002",
      firstName: "Maria",
      lastName: "Santos",
      email: "maria.santos@domc.edu.ph",
      year: "2nd Year",
      section: "B",
      status: "Not On Duty",
      archived: false,
    },
    {
      id: "CLK003",
      firstName: "Jose",
      lastName: "Reyes",
      email: "jose.reyes@domc.edu.ph",
      year: "4th Year",
      section: "A",
      status: "On Duty",
      archived: false,
    },
    {
      id: "CLK004",
      firstName: "Ana",
      lastName: "Garcia",
      email: "ana.garcia@domc.edu.ph",
      year: "1st Year",
      section: "C",
      status: "Not On Duty",
      archived: false,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClerk, setSelectedClerk] = useState<Clerk | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    year: "",
    section: "",
    status: "Not On Duty" as "On Duty" | "Not On Duty",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showArchived, setShowArchived] = useState(false)

  type FilterType = "all" | "on-duty" | "not-on-duty"
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  // Validation function
  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    if (!formData.year) {
      errors.year = "Year is required"
    }
    
    if (!formData.section) {
      errors.section = "Section is required"
    }
    
    if (!formData.status) {
      errors.status = "Status is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Filter clerks based on search term, archived status, and duty status
  const filteredClerks = clerks.filter((clerk) => {
    // First filter by archived status
    if (showArchived && !clerk.archived) return false
    if (!showArchived && clerk.archived) return false
    
    // Then filter by duty status
    if (activeFilter === "on-duty" && clerk.status !== "On Duty") return false
    if (activeFilter === "not-on-duty" && clerk.status !== "Not On Duty") return false
    
    // Finally filter by search term
    return (
      clerk.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddClerk = () => {
    if (validateForm()) {
      const newClerk: Clerk = {
        id: `CLK${String(clerks.length + 1).padStart(3, "0")}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        year: formData.year,
        section: formData.section,
        status: formData.status,
        archived: false,
      }
      setClerks([...clerks, newClerk])
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        year: "",
        section: "",
        status: "Not On Duty",
      })
      setFormErrors({})
      setIsAddModalOpen(false)
    }
  }

  const handleEditClerk = () => {
    if (selectedClerk && validateForm()) {
      setClerks(
        clerks.map((clerk) =>
          clerk.id === selectedClerk.id
            ? {
                ...clerk,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                year: formData.year,
                section: formData.section,
                status: formData.status,
              }
            : clerk,
        ),
      )
      setIsEditModalOpen(false)
      setSelectedClerk(null)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        year: "",
        section: "",
        status: "Not On Duty",
      })
      setFormErrors({})
    }
  }

  const openEditModal = (clerk: Clerk) => {
    setSelectedClerk(clerk)
    setFormData({
      firstName: clerk.firstName,
      lastName: clerk.lastName,
      email: clerk.email,
      year: clerk.year,
      section: clerk.section,
      status: clerk.status,
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Function to archive/unarchive clerk
  const handleArchiveClerk = (clerkId: string) => {
    setClerks(
      clerks.map((clerk: Clerk) =>
        clerk.id === clerkId ? { ...clerk, archived: !clerk.archived } : clerk,
      ),
    )
    const clerk = clerks.find((c) => c.id === clerkId)
    if (clerk) {
      // You can add toast notification here if you have useToast hook
      console.log(`Clerk ${clerk.firstName} ${clerk.lastName} has been ${clerk.archived ? "unarchived" : "archived"}.`)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      year: "",
      section: "",
      status: "Not On Duty",
    })
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clerks Management</h1>
          <p className="text-gray-600">Manage clerk accounts and their information</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-start">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search clerks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clerks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-semibold text-[#333]">
                {showArchived ? "Archived Clerks" : "Active Clerks"}
              </CardTitle>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={activeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className={activeFilter === "all" ? "bg-[#5C8E77] hover:bg-[#4a7a63]" : ""}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === "on-duty" ? "default" : "ghost"}
                  size="sm"
                  className={activeFilter === "on-duty" ? "bg-[#5C8E77] hover:bg-[#4a7a63]" : ""}
                  onClick={() => setActiveFilter("on-duty")}
                >
                  On Duty
                </Button>
                <Button
                  variant={activeFilter === "not-on-duty" ? "default" : "ghost"}
                  size="sm"
                  className={activeFilter === "not-on-duty" ? "bg-[#5C8E77] hover:bg-[#4a7a63]" : ""}
                  onClick={() => setActiveFilter("not-on-duty")}
                >
                  Not On Duty
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
            <div className="flex flex-col items-end">
              {/* Add Clerk Button */}
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white" onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Clerk
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Clerk</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Enter first name"
                          className={formErrors.firstName ? "border-red-500" : ""}
                        />
                        {formErrors.firstName && (
                          <p className="text-sm text-red-500">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Enter last name"
                          className={formErrors.lastName ? "border-red-500" : ""}
                        />
                        {formErrors.lastName && (
                          <p className="text-sm text-red-500">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        className={formErrors.email ? "border-red-500" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select
                          value={formData.year}
                          onValueChange={(value) => setFormData({ ...formData, year: value })}
                        >
                          <SelectTrigger className={formErrors.year ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.year && (
                          <p className="text-sm text-red-500">{formErrors.year}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Select
                          value={formData.section}
                          onValueChange={(value) => setFormData({ ...formData, section: value })}
                        >
                          <SelectTrigger className={formErrors.section ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.section && (
                          <p className="text-sm text-red-500">{formErrors.section}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "On Duty" | "Not On Duty") =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger className={formErrors.status ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="On Duty">On Duty</SelectItem>
                          <SelectItem value="Not On Duty">Not On Duty</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.status && (
                        <p className="text-sm text-red-500">{formErrors.status}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddClerk} className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white">
                      Add Clerk
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clerk ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClerks.map((clerk) => (
                <TableRow 
                  key={clerk.id}
                  className={`${clerk.archived ? "bg-gray-50 opacity-75" : ""}`}
                >
                  <TableCell className="font-medium">{clerk.id}</TableCell>
                  <TableCell>{clerk.firstName}</TableCell>
                  <TableCell>{clerk.lastName}</TableCell>
                  <TableCell>{clerk.email}</TableCell>
                  <TableCell>{clerk.year}</TableCell>
                  <TableCell>{clerk.section}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={clerk.status === "On Duty" ? "default" : "secondary"}
                        className={
                          clerk.status === "On Duty"
                            ? "bg-[#5C8E77] hover:bg-[#4a7a63] text-white"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {clerk.status}
                      </Badge>
                      {clerk.archived && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(clerk)}
                        className="text-[#5C8E77] hover:text-[#4a7a63] hover:bg-[#e6f7eb]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`${clerk.archived ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
                        onClick={() => handleArchiveClerk(clerk.id)}
                        title={clerk.archived ? "Unarchive clerk" : "Archive clerk"}
                      >
                        {clerk.archived ? (
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
              ))}
            </TableBody>
          </Table>
          {filteredClerks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No clerks found matching your search." : "No clerks found."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Clerk Information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className={formErrors.firstName ? "border-red-500" : ""}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className={formErrors.lastName ? "border-red-500" : ""}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editYear">Year</Label>
                <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                  <SelectTrigger className={formErrors.year ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.year && (
                  <p className="text-sm text-red-500">{formErrors.year}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSection">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                >
                  <SelectTrigger className={formErrors.section ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.section && (
                  <p className="text-sm text-red-500">{formErrors.section}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "On Duty" | "Not On Duty") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className={formErrors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="Not On Duty">Not On Duty</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClerk} className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
