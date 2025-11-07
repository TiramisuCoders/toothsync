"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Clerk {
  id: string
  clerk_id: string
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
  const [clerks, setClerks] = useState<Clerk[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

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
  const [clerkFormData, setClerkFormData] = useState({
    academic_year: "",
    status: "Not On Duty" as "On Duty" | "Not On Duty",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showArchived, setShowArchived] = useState(false)

  type FilterType = "all" | "on-duty" | "not-on-duty"
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  useEffect(() => {
    fetchClerks()
    fetchAvailableUsers()
  }, [])

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/clerks/available-users", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch available users")
      }

      const result = await response.json()
      setAvailableUsers(result.data || [])
      
    } catch (err) {
      console.error("Failed to fetch available users:", err)
    }
  }

  const fetchClerks = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/clerks", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorData.message || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          errorMessage += `: ${responseText}`
        }
        
        throw new Error(errorMessage)
      }

      let raw
      try {
        raw = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Invalid JSON response from server")
      }

      const payload = Array.isArray(raw) ? raw : raw?.data || []

      if (!Array.isArray(payload)) {
        throw new Error("Expected array of clerks from API")
      }

      const normalized: Clerk[] = (payload as any[]).map((c, i) => {
        return {
          id: String(c?.id ?? `CLK${String(i + 1).padStart(3, '0')}`),
          clerk_id: String(c?.clerk_id ?? c?.user_id ?? ''),
          firstName: c?.firstName ?? c?.first_name ?? '',
          lastName: c?.lastName ?? c?.last_name ?? '',
          email: c?.email ?? '',
          year: c?.year ?? '1st Year',
          section: c?.section ?? 'A',
          status: (c?.status === "On Duty" || c?.status === "Not On Duty") ? c.status : "Not On Duty",
          archived: c?.archived ?? false,
        }
      })

      setClerks(normalized)
      
      toast({
        title: "Success",
        description: `Successfully loaded ${normalized.length} clerks`,
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch clerks"
      
      toast({
        variant: "destructive",
        title: "Error Loading Clerks",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (_isEdit: boolean = false): boolean => {
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

  const filteredClerks = clerks.filter((clerk) => {
    if (showArchived) {
      if (!clerk.archived) return false
    } else {
      if (clerk.archived) return false
    }
    
    if (activeFilter === "on-duty" && clerk.status !== "On Duty") return false
    if (activeFilter === "not-on-duty" && clerk.status !== "Not On Duty") return false
    
    return (
      clerk.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clerk.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleAddClerk = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a user to promote to clerk",
      })
      return
    }

    if (!clerkFormData.academic_year) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in academic year",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/clerks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.auth_user_id,
          academic_year: clerkFormData.academic_year,
          status: clerkFormData.status
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || "Failed to add clerk")
      }

      await fetchClerks()
      await fetchAvailableUsers()
      
      setSelectedUser(null)
      setClerkFormData({
        academic_year: "",
        status: "Not On Duty",
      })
      setIsAddModalOpen(false)
      
      toast({
        title: "Success",
        description: `Successfully promoted ${selectedUser.first_name} ${selectedUser.last_name} to clerk`,
      })
      
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error Adding Clerk",
        description: err instanceof Error ? err.message : "Failed to add clerk",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClerk = async () => {
    if (selectedClerk && validateForm(true)) {
      try {
        setLoading(true)

        if (!selectedClerk.clerk_id) {
          throw new Error("Clerk ID is missing. Cannot update clerk.")
        }

        const response = await fetch("/api/clerks", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_id: selectedClerk.clerk_id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            year: formData.year,
            section: formData.section,
            status: formData.status,
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || result.details || "Failed to update clerk")
        }

        await fetchClerks()
        
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
        
        toast({
          title: "Success",
          description: "Clerk updated successfully",
        })
        
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error Updating Clerk",
          description: err instanceof Error ? err.message : "Failed to update clerk",
        })
      } finally {
        setLoading(false)
      }
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

  const handleArchiveClerk = async (clerk: Clerk) => {
    try {
      setLoading(true)
      
      if (!clerk.clerk_id) {
        throw new Error("Clerk ID is missing. Cannot archive/unarchive clerk.")
      }
      
      const action = clerk.archived ? 'unarchive' : 'archive'
      
      const response = await fetch("/api/clerks", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: clerk.clerk_id,
          action: action
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || `Failed to ${action} clerk`)
      }

      await fetchClerks()
      
      toast({
        title: "Success",
        description: `Clerk ${action}d successfully`,
      })
      
    } catch (err) {
      toast({
        variant: "destructive",
        title: `Error ${clerk.archived ? 'Unarchiving' : 'Archiving'} Clerk`,
        description: err instanceof Error ? err.message : `Failed to ${clerk.archived ? 'unarchive' : 'archive'} clerk`,
      })
    } finally {
      setLoading(false)
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
    setClerkFormData({
      academic_year: "",
      status: "Not On Duty",
    })
    setSelectedUser(null)
    setFormErrors({})
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clerks Management</h1>
          <p className="text-gray-600">Manage clerk accounts and their information</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clerks Management</h1>
          <p className="text-gray-600">Manage clerk accounts and their information</p>
        </div>
      </div>

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
                  {showArchived ? "Show Active" : "Show Archived"}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white" 
                    onClick={resetForm}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Clerk
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Promote User to Clerk</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Select User (R01 - Clinicians)</Label>
                      <Select 
                        value={selectedUser?.auth_user_id || ""} 
                        onValueChange={(value) => {
                          const user = availableUsers.find(u => u.auth_user_id === value)
                          setSelectedUser(user)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a clinician to promote to clerk" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.auth_user_id} value={user.auth_user_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {user.email} • {user.sex}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableUsers.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No R01 (Clinician) users available for promotion.
                        </p>
                      )}
                    </div>

                    {selectedUser && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Selected Clinician:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</div>
                          <div><strong>Email:</strong> {selectedUser.email}</div>
                          <div><strong>Current Role:</strong> R01 (Clinician)</div>
                          <div><strong>Gender:</strong> {selectedUser.sex}</div>
                          {selectedUser.contact_number && (
                            <div><strong>Contact:</strong> {selectedUser.contact_number}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Select
                          value={clerkFormData.academic_year}
                          onValueChange={(value) => setClerkFormData({ ...clerkFormData, academic_year: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AY2024-1">AY2024-1 (2024-2025, 1st Semester)</SelectItem>
                            <SelectItem value="AY2024-2">AY2024-2 (2024-2025, 2nd Semester)</SelectItem>
                            <SelectItem value="AY2025-1">AY2025-1 (2025-2026, 1st Semester)</SelectItem>
                            <SelectItem value="AY2025-2">AY2025-2 (2025-2026, 2nd Semester)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select
                          value={clerkFormData.status}
                          onValueChange={(value: "On Duty" | "Not On Duty") =>
                            setClerkFormData({ ...clerkFormData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select initial status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On Duty">On Duty</SelectItem>
                            <SelectItem value="Not On Duty">Not On Duty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsAddModalOpen(false)
                      setSelectedUser(null)
                      setClerkFormData({ academic_year: "", status: "Not On Duty" })
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddClerk} 
                      className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white"
                      disabled={!selectedUser || loading}
                    >
                      {loading ? "Promoting..." : "Promote to Clerk"}
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
              {filteredClerks.length > 0 ? (
                filteredClerks.map((clerk) => (
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
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`${clerk.archived ? "text-green-600 hover:bg-green-50" : "text-orange-600 hover:bg-orange-50"}`}
                          onClick={() => handleArchiveClerk(clerk)}
                          disabled={loading}
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    {searchTerm ? "No clerks found matching your search." : "No clerks found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Clerk Information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">User Information (Read Only):</h4>
              <div className="grid gap-2 text-sm">
                <div><strong>Name:</strong> {selectedClerk?.firstName} {selectedClerk?.lastName}</div>
                <div><strong>Email:</strong> {selectedClerk?.email}</div>
                <div><strong>Current Section:</strong> {selectedClerk?.section}</div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="editYear">Academic Year</Label>
                <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                  <SelectTrigger className={formErrors.year ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AY2024-1">AY2024-1</SelectItem>
                    <SelectItem value="AY2024-2">AY2024-2</SelectItem>
                    <SelectItem value="AY2025-1">AY2025-1</SelectItem>
                    <SelectItem value="AY2025-2">AY2025-2</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.year && (
                  <p className="text-sm text-red-500">{formErrors.year}</p>
                )}
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClerk} className="bg-[#5C8E77] hover:bg-[#4a7a63] text-white" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}