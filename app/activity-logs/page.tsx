"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

// Sample log data
const activityLogs = [
  {
    id: "1",
    timestamp: "2025-05-15 09:00 AM",
    userName: "John Dela Cruz",
    role: "Admin",
    action: "Login",
    description: "Admin logged into the system",
  },
  {
    id: "2",
    timestamp: "2025-05-15 09:15 AM",
    userName: "Maria Santos",
    role: "Clinician",
    action: "Create",
    description: "Created new activity #1",
  },
  {
    id: "3",
    timestamp: "2025-05-15 09:30 AM",
    userName: "Dr. Reyes",
    role: "Instructor",
    action: "Update",
    description: "Updated activity status to 'Started'",
  },
  {
    id: "4",
    timestamp: "2025-05-15 10:05 AM",
    userName: "Admin User",
    role: "Admin",
    action: "Create",
    description: "Added new instructor account",
  },
  {
    id: "5",
    timestamp: "2025-05-15 10:30 AM",
    userName: "Jose Clerk",
    role: "Clerk",
    action: "Update",
    description: "Updated chair assignment",
  },
  {
    id: "6",
    timestamp: "2025-05-15 11:00 AM",
    userName: "Maria Santos",
    role: "Clinician",
    action: "Update",
    description: "Added second procedure to activity #1",
  },
  {
    id: "7",
    timestamp: "2025-05-15 11:45 AM",
    userName: "Dr. Santos",
    role: "Instructor",
    action: "View",
    description: "Viewed clinician reports",
  },
  {
    id: "8",
    timestamp: "2025-05-15 12:30 PM",
    userName: "John Dela Cruz",
    role: "Admin",
    action: "Delete",
    description: "Removed expired academic year",
  },
  {
    id: "9",
    timestamp: "2025-05-15 01:15 PM",
    userName: "Anna Lim",
    role: "Clinician",
    action: "Create",
    description: "Submitted attendance form",
  },
  {
    id: "10",
    timestamp: "2025-05-15 02:00 PM",
    userName: "Admin User",
    role: "Admin",
    action: "Logout",
    description: "Admin logged out of the system",
  },
]

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedAction, setSelectedAction] = useState("all")

  // Filter logs based on search and filters
  const filteredLogs = activityLogs.filter((log) => {
    // Search filter
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.includes(searchTerm)

    // Role filter
    const matchesRole = selectedRole === "all" || log.role.toLowerCase() === selectedRole.toLowerCase()

    // Action filter
    const matchesAction = selectedAction === "all" || log.action.toLowerCase() === selectedAction.toLowerCase()

    return matchesSearch && matchesRole && matchesAction
  })

  // Function to get badge color based on action
  const getActionBadgeColor = (action) => {
    switch (action.toLowerCase()) {
      case "login":
      case "logout":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      case "create":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "update":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "delete":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "view":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <DashboardLayout currentRole="admin">
      <div className="flex flex-col gap-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Activity Logs</h2>
          <p className="text-gray-500">Track all system interactions including logins, updates, and changes</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user, description, or log ID"
                className="pl-9 border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="clinician">Clinician</SelectItem>
                <SelectItem value="clerk">Clerk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity Logs Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-[#333]">System Activity Logs</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-1 border-gray-300 text-sm h-9 px-3">
                <Calendar className="h-4 w-4" /> Filter Date
              </Button>
              <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-1 text-sm h-9 px-3">
                <Download className="h-4 w-4" /> Export Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white border-b border-gray-200">
                <TableRow className="hover:bg-white border-b-0">
                  <TableHead className="font-medium text-[#333]">Log ID</TableHead>
                  <TableHead className="font-medium text-[#333]">Timestamp</TableHead>
                  <TableHead className="font-medium text-[#333]">User Name</TableHead>
                  <TableHead className="font-medium text-[#333]">Role</TableHead>
                  <TableHead className="font-medium text-[#333]">Action</TableHead>
                  <TableHead className="font-medium text-[#333]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="font-medium text-[#333]">{log.id}</TableCell>
                      <TableCell className="text-[#333]">{log.timestamp}</TableCell>
                      <TableCell className="text-[#333]">{log.userName}</TableCell>
                      <TableCell className="text-[#333]">{log.role}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-[#333]">{log.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      No activity logs found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
