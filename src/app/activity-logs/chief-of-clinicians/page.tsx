"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Search } from "lucide-react"

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedAction, setSelectedAction] = useState("all")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/activity-logs")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setLogs(data || [])
        setError(null)
      } catch (err: any) {
        console.error("Error fetching activity logs:", err)
        setError(err.message || "Failed to fetch activity logs")
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toString().includes(searchTerm)

    const matchesRole = selectedRole === "all" || log.role?.toLowerCase() === selectedRole.toLowerCase()

    const matchesAction = selectedAction === "all" || log.action?.toLowerCase() === selectedAction.toLowerCase()

    return matchesSearch && matchesRole && matchesAction
  })

  const getActionBadgeColor = (action: string) => {
    switch (action?.toLowerCase()) {
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
    <div className="flex flex-col gap-6">
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
              placeholder="Search by details or log ID"
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

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-800">Error: {error}</p>
            <p className="text-red-600 text-sm mt-1">
              Please ensure Supabase is properly configured in Project Settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-[#333]">System Activity Logs</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-1 border-gray-300 text-sm h-9 px-3 bg-transparent"
            >
              <Calendar className="h-4 w-4" /> Filter Date
            </Button>
            <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-1 text-sm h-9 px-3">
              <Download className="h-4 w-4" /> Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading logs...</div>
          ) : (
            <Table>
              <TableHeader className="bg-white border-b border-gray-200">
                <TableRow className="hover:bg-white border-b-0">
                  <TableHead>Log ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="text-[#333]">{log.id}</TableCell>
                      <TableCell className="text-[#333]">{log.user_id}</TableCell>
                      <TableCell className="text-[#333]">{log.role}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-[#333]">{log.details}</TableCell>
                      <TableCell className="text-[#333]">{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      {error
                        ? "Unable to load activity logs."
                        : "No activity logs found matching your search criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
