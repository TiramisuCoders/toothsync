//app/clerks/chief-of-clinicians/ClerkAdmin.tsx

"use client"

import { useState, useEffect } from "react"
import { Plus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Clerk {
  id: string
  clerk_id: string
  firstName: string
  lastName: string
  email: string
  year: string
  yearDisplay: string
  semester: string
  section: string
  status: "On Duty" | "Not On Duty"
  archived?: boolean
}

interface AcademicYear {
  id: string
  academic_year: string
  semester: string
  status: string
}

export default function ClerksPage() {
  const [clerks, setClerks] = useState<Clerk[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const [clerkFormData, setClerkFormData] = useState({
    academic_year: "",
    status: "Not On Duty" as "On Duty" | "Not On Duty",
  })
  
  const [showArchived, setShowArchived] = useState(false)

  type FilterType = "all" | "on-duty" | "not-on-duty"
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  useEffect(() => {
    fetchClerks()
    fetchAvailableUsers()
    fetchAcademicYears()
  }, [])

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/clerks?type=academic-years", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch academic years")
      }

      const result = await response.json()
      setAcademicYears(result.data || [])
      console.log("✅ Fetched academic years:", result.data?.length || 0)
      
    } catch (err) {
      console.error("❌ Failed to fetch academic years:", err)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/clerks?type=available-users", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch available users")
      }

      const result = await response.json()
      setAvailableUsers(result.data || [])
      console.log("✅ Fetched available users:", result.data?.length || 0)
      
    } catch (err) {
      console.error("❌ Failed to fetch available users:", err)
    }
  }

  const fetchClerks = async () => {
    try {
      setLoading(true)
      setError(null)

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
          year: c?.year ?? '',
          yearDisplay: c?.yearDisplay ?? c?.year ?? '',
          semester: c?.semester ?? '',
          section: c?.section ?? 'A',
          status: (c?.status === "On Duty" || c?.status === "Not On Duty") ? c.status : "Not On Duty",
          archived: c?.archived ?? false,
        }
      })

      setClerks(normalized)
      
      
    } catch (err) {
      console.error("❌ Clerk fetch error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch clerks"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
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
      setError("Please select a user to promote to clerk")
      return
    }

    if (!clerkFormData.academic_year) {
      setError("Please fill in academic year")
      return
    }

    try {
      setLoading(true)
      setError(null)

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
      setDebugInfo(`Successfully promoted ${selectedUser.first_name} ${selectedUser.last_name} to clerk`)
      
    } catch (err) {
      console.error("Error adding clerk:", err)
      setError(err instanceof Error ? err.message : "Failed to add clerk")
    } finally {
      setLoading(false)
    }
  }

  const handleEditStatus = async (clerk: Clerk, newStatus: "On Duty" | "Not On Duty") => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/clerks", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: clerk.clerk_id,
          status: newStatus
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || "Failed to update clerk status")
      }

      await fetchClerks()
      setDebugInfo("Clerk status updated successfully")
      
    } catch (err) {
      console.error("Error updating clerk status:", err)
      setError(err instanceof Error ? err.message : "Failed to update clerk status")
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveClerk = async (clerk: Clerk) => {
    try {
      setLoading(true)
      setError(null)
      
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
      setDebugInfo(`Clerk ${action}d successfully`)
      
    } catch (err) {
      console.error(`Error ${clerk.archived ? 'unarchiving' : 'archiving'} clerk:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${clerk.archived ? 'unarchive' : 'archive'} clerk`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setClerkFormData({
      academic_year: "",
      status: "Not On Duty",
    })
    setSelectedUser(null)
  }

  if (loading && clerks.length === 0) {
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clerks Management</h1>
          <p className="text-gray-600">Manage clerk accounts and their information</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            <div className="mb-2">
              <strong>Error:</strong> {error}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-red-600"
              onClick={fetchClerks}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Info */}
      {!error && debugInfo && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {debugInfo}
          </AlertDescription>
        </Alert>
      )}

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
                  {showArchived ? "Show Active" : "Show Archived"}
                </Button>
              </div>
            </div>
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
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.academic_year} - {year.semester} Semester
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {academicYears.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No active academic years found.
                        </p>
                      )}
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
                    disabled={!selectedUser || !clerkFormData.academic_year || loading}
                  >
                    {loading ? "Promoting..." : "Promote to Clerk"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <TableHead>Academic Year</TableHead>
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
                    <TableCell>
                      {clerk.yearDisplay ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{clerk.yearDisplay}</span>
                          {clerk.semester && (
                            <span className="text-xs text-gray-500">{clerk.semester} Semester</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>{clerk.section}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={clerk.status === "On Duty" ? "default" : "secondary"}
                          className={
                            clerk.status === "On Duty"
                              ? "bg-[#5C8E77] hover:bg-[#4a7a63] text-white cursor-pointer"
                              : "bg-gray-100 text-gray-700 cursor-pointer"
                          }
                          onClick={() => {
                            if (!clerk.archived) {
                              handleEditStatus(
                                clerk,
                                clerk.status === "On Duty" ? "Not On Duty" : "On Duty"
                              )
                            }
                          }}
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
    </div>
  )
}