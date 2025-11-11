//app/activity-logs/chief-of-clinicians/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Search, AlertTriangle, AlertCircle, Info, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type SeverityLevel = "All" | "INFO" | "WARN" | "ERROR"

interface ActivityLog {
  id: string
  user_id: string
  user_display: string
  user_email: string
  role: string
  action: string
  action_key: string
  details: string
  created_at: string
  severity: string
  category: string
  ip_address: string
  city: string
  country: string
}

export default function ChiefOfClinicianActivityLogs() {
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>("All")

  useEffect(() => {
    fetchLogs()
  }, [selectedSeverity])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const url = selectedSeverity === "All" 
        ? "/api/activity-logs"
        : `/api/activity-logs?severity=${selectedSeverity}`
        
      const response = await fetch(url)
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getSeverityIcon = (severity: string) => {
    if (severity === "ERROR") return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (severity === "WARN") return <AlertCircle className="h-4 w-4 text-orange-600" />
    return <Info className="h-4 w-4 text-blue-600" />
  }

  const getSeverityBadgeColor = (severity: string) => {
    if (severity === "ERROR") return "bg-red-50 text-red-700 border border-red-200"
    if (severity === "WARN") return "bg-orange-50 text-orange-700 border border-orange-200"
    return "bg-blue-50 text-blue-700 border border-blue-200"
  }

  const getCounts = () => ({
    all: logs.length,
    error: logs.filter((log) => log.severity === "ERROR").length,
    warn: logs.filter((log) => log.severity === "WARN").length,
    info: logs.filter((log) => log.severity === "INFO").length,
  })

  const counts = getCounts()

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "User", "Email", "Role", "Severity", "Action"],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user_display,
        log.user_email,
        log.role,
        log.severity,
        log.action
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleCreateReport = (log: ActivityLog) => {
    // Prepare the data to be passed via query params
    const ticketData = {
      title: `Warning Report: ${log.action}`,
      description: `Activity Log Warning Report\n\nAction: ${log.action}\nUser: ${log.user_display} (${log.user_email})\nRole: ${log.role}\nTimestamp: ${new Date(log.created_at).toLocaleString()}\nCategory: ${log.category}\nIP Address: ${log.ip_address}\nLocation: ${log.city}, ${log.country}\n\nDetails:\n${log.details || 'No additional details'}\n\nAction Key: ${log.action_key}\nLog ID: ${log.id}`,
      affectedModule: "Activity Logs",
      category: "System Warning"
    }

    // Store in sessionStorage for the form to pick up
    sessionStorage.setItem('ticketPrefill', JSON.stringify(ticketData))
    
    // Navigate to the ticket form
    router.push('/support/faq/new-ticket')
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#333]">Activity Logs</h2>
        <p className="text-gray-500">Track all system activities and security events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", level: "All" as SeverityLevel, count: counts.all, icon: null },
          { label: "Error", level: "ERROR" as SeverityLevel, count: counts.error, icon: <AlertTriangle className="h-4 w-4" /> },
          { label: "Warning", level: "WARN" as SeverityLevel, count: counts.warn, icon: <AlertCircle className="h-4 w-4" /> },
          { label: "Info", level: "INFO" as SeverityLevel, count: counts.info, icon: <Info className="h-4 w-4" /> },
        ].map((filter) => (
          <Button
            key={filter.level}
            onClick={() => setSelectedSeverity(filter.level)}
            variant={selectedSeverity === filter.level ? "default" : "outline"}
            className={`${
              selectedSeverity === filter.level
                ? "bg-[#5C8E77] hover:bg-[#406E58] text-white border-none"
                : "border-gray-300 text-[#333] hover:bg-gray-50"
            } flex items-center gap-2`}
          >
            {filter.icon && (
              <span
                className={
                  selectedSeverity === filter.level
                    ? "text-white"
                    : filter.level === "ERROR"
                      ? "text-red-600"
                      : filter.level === "WARN"
                        ? "text-orange-600"
                        : filter.level === "INFO"
                          ? "text-blue-600"
                          : ""
                }
              >
                {filter.icon}
              </span>
            )}
            {filter.label} {filter.count > 0 && <span className="text-sm opacity-75">({filter.count})</span>}
          </Button>
        ))}
      </div>

      {/* Search & Export */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by action, user, email, or details..."
            className="pl-9 border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="bg-[#5C8E77] hover:bg-[#406E58] text-white border-none flex items-center gap-2"
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
        >
          <Download className="h-4 w-4" /> Export CSV
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
                    <TableHead className="flex-1"></TableHead>
                    <TableHead className="flex-1">Timestamp</TableHead>
                    <TableHead className="flex-1">User</TableHead>
                    <TableHead className="flex-1">Action</TableHead>
                    <TableHead className="flex-1"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(log.severity)}
                            <Badge className={`${getSeverityBadgeColor(log.severity)} text-xs`}>
                              {log.severity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium text-[#333]">{log.user_display}</div>
                          <div className="text-xs text-gray-500">{log.user_email}</div>
                          <div className="text-xs text-gray-400">{log.role}</div>
                        </TableCell>
                        <TableCell className="text-sm text-[#333]">
                          {log.action}
                        </TableCell>
                        <TableCell>
                          {log.severity === "WARN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              onClick={() => handleCreateReport(log)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Create Report
                            </Button>
                          )}
                        </TableCell>
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