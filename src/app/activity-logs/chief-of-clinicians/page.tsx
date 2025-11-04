"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, AlertTriangle, AlertCircle, Info } from "lucide-react"

type LogLevel = "All" | "Exception" | "Warning" | "Information"

interface ActivityLog {
  id: string
  user_id: string
  user_display: string
  role: string
  action: string
  details: string
  created_at: string
}

export default function ChiefOfClinicianActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>("All")

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
        setError(err.message || "Failed to load logs.")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const getLogLevel = (action: string): string => {
    const actionLower = action?.toLowerCase() || ""
    if (["delete", "error", "failed"].includes(actionLower)) return "Exception"
    if (["update", "warning"].includes(actionLower)) return "Warning"
    if (["login", "logout", "create", "view"].includes(actionLower)) return "Information"
    return "Information"
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toString().includes(searchTerm) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase())

    const logLevel = getLogLevel(log.action)
    const matchesLevel = selectedLevel === "All" || logLevel === selectedLevel

    return matchesSearch && matchesLevel
  })

  const getLevelIcon = (action: string) => {
    const level = getLogLevel(action)
    if (level === "Exception") return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (level === "Warning") return <AlertCircle className="h-4 w-4 text-orange-600" />
    return <Info className="h-4 w-4 text-blue-600" />
  }

  const getLevelBadgeColor = (action: string) => {
    const level = getLogLevel(action)
    if (level === "Exception") return "bg-red-50 text-red-700 border border-red-200"
    if (level === "Warning") return "bg-orange-50 text-orange-700 border border-orange-200"
    return "bg-blue-50 text-blue-700 border border-blue-200"
  }

  const getCounts = () => ({
    all: logs.length,
    exception: logs.filter((log) => getLogLevel(log.action) === "Exception").length,
    warning: logs.filter((log) => getLogLevel(log.action) === "Warning").length,
    information: logs.filter((log) => getLogLevel(log.action) === "Information").length,
  })

  const counts = getCounts()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#333]">Activity Logs</h2>
        <p className="text-gray-500">Track all clinician system interactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
            { label: "All", level: "All" as LogLevel, count: counts.all, icon: null },
            { label: "Exception", level: "Exception" as LogLevel, count: counts.exception, icon: <AlertTriangle className="h-4 w-4" /> },
            { label: "Warning", level: "Warning" as LogLevel, count: counts.warning, icon: <AlertCircle className="h-4 w-4" /> },
            { label: "Information", level: "Information" as LogLevel, count: counts.information, icon: <Info className="h-4 w-4" /> },
          ].map((filter) => (
            <Button
              key={filter.level}
              onClick={() => setSelectedLevel(filter.level)}
              variant={selectedLevel === filter.level ? "default" : "outline"}
              className={`${
                selectedLevel === filter.level
                  ? "bg-[#5C8E77] hover:bg-[#406E58] text-white border-none"
                  : "border-gray-300 text-[#333] hover:bg-gray-50"
              } flex items-center gap-2`}
            >
              {filter.icon && (
                <span
                  className={
                    selectedLevel === filter.level
                      ? "text-white"
                      : filter.level === "Exception"
                        ? "text-red-600"
                        : filter.level === "Warning"
                          ? "text-orange-600"
                          : filter.level === "Information"
                            ? "text-blue-600"
                            : ""
                  }
                >
                  {filter.icon}
                </span>
              )}
              {filter.label} {filter.count > 0 && <span className="text-sm opacity-75">{filter.count}</span>}
            </Button>
          ))}
      </div>

      {/* Search & Export */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by details, ID, or action..."
            className="pl-9 border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-red-800">Error: {error}</p>
            <p className="text-red-600 text-sm mt-1">Please ensure the API is properly configured.</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-[#333]">Activity Log Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="w-12">Level</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell>{getLevelIcon(log.action)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium text-[#333]">{log.user_display}</div>
                          <div className="text-xs text-gray-500">{log.role}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getLevelBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">{log.details}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        {error ? "Unable to load activity logs." : "No activity logs found matching your criteria."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500">
        Showing {filteredLogs.length} of {logs.length} log entries
      </div>
    </div>
  )
}
