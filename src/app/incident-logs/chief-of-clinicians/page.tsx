"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Calendar, User, AlertTriangle, Paperclip, Clock, Save } from "lucide-react"

interface StatusHistory {
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  changedBy: string
  changedAt: string
  comment?: string
}

interface Incident {
  id: string
  ticketTitle: string
  affectedModule: string
  category: string
  description: string
  reportedBy: string
  reportedDate: string
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  priority: "Low" | "Medium" | "High" | "Critical"
  attachments?: string[]
  statusHistory: StatusHistory[]
}

// Category mappings based on affected module
const moduleCategories = {
  "Login & Authentication": [
    "Unable to Log In",
    "Account Locked",
    "Forgotten Password",
    "Role Access Issue",
    "Role Permissions Not Working",
    "Others",
  ],
  "Instructor Management": [
    "Instructor Not Assigned",
    "Missing Grade Entry",
    "Instructor Assigned Outside Schedule",
    "Access or Visibility Issue",
    "Unequal Instructor Load",
    "Others",
  ],
  "Resource Allocation": [
    "Chair Assignment Error",
    "Incorrect Chair Assignment",
    "Resource Not Appearing",
    "Manual Override Failed",
    "Inaccurate Chair Status",
    "Others",
  ],
  "Service Request Form": [
    "Form Submission Error",
    "Cannot Upload Attachment",
    "Admin Not Assigned",
    "Incorrect Form Access",
    "Cannot Update Request",
    "Others",
  ],
  "Dashboard/UI": [
    "Data Not Loading",
    "Missing Logs or Data",
    "Wrong Summary Displayed",
    "Logbook Export Fails",
    "Action Buttons Not Responding",
    "Others",
  ],
  Others: [
    "Ticket Missing",
    "Unexpected Error Message",
    "Attendance Log Not Updating",
    "Data Integrity Issue",
    "Performance Lag",
    "General Inquiry",
  ],
}

// Sample incident data
const sampleIncidents: Incident[] = [
  {
    id: "INC001",
    ticketTitle: "Unable to access instructor dashboard",
    affectedModule: "Login & Authentication",
    category: "Role Access Issue",
    description:
      "Instructor cannot access their dashboard after logging in. The system redirects to a blank page instead of the instructor interface.",
    reportedBy: "maria.santos@domc.edu.ph",
    reportedDate: "2024-01-15",
    status: "Open",
    priority: "High",
    attachments: ["screenshot-error.png"],
    statusHistory: [
      {
        status: "Open",
        changedBy: "System",
        changedAt: "2024-01-15T09:30:00Z",
        comment: "Incident reported",
      },
    ],
  },
  {
    id: "INC002",
    ticketTitle: "Chair assignment not updating in real-time",
    affectedModule: "Resource Allocation",
    category: "Inaccurate Chair Status",
    description:
      "When a chair is assigned to a student, the status doesn't update immediately in the system. Other users can still see it as available.",
    reportedBy: "john.delacruz@domc.edu.ph",
    reportedDate: "2024-01-14",
    status: "In Progress",
    priority: "Medium",
    statusHistory: [
      {
        status: "Open",
        changedBy: "System",
        changedAt: "2024-01-14T10:15:00Z",
        comment: "Incident reported",
      },
      {
        status: "In Progress",
        changedBy: "Admin User",
        changedAt: "2024-01-14T14:30:00Z",
        comment: "Assigned to development team for investigation",
      },
    ],
  },
  {
    id: "INC003",
    ticketTitle: "Attendance form submission fails",
    affectedModule: "Service Request Form",
    category: "Form Submission Error",
    description:
      "Students are unable to submit their attendance forms. The submit button becomes unresponsive after clicking.",
    reportedBy: "admin@domc.edu.ph",
    reportedDate: "2024-01-13",
    status: "Resolved",
    priority: "Critical",
    attachments: ["error-log.txt", "form-screenshot.png"],
    statusHistory: [
      {
        status: "Open",
        changedBy: "System",
        changedAt: "2024-01-13T08:00:00Z",
        comment: "Incident reported",
      },
      {
        status: "In Progress",
        changedBy: "Admin User",
        changedAt: "2024-01-13T08:30:00Z",
        comment: "High priority - investigating immediately",
      },
      {
        status: "Resolved",
        changedBy: "Admin User",
        changedAt: "2024-01-13T12:45:00Z",
        comment: "Fixed form validation issue and deployed patch",
      },
    ],
  },
  {
    id: "INC004",
    ticketTitle: "Dashboard data not loading properly",
    affectedModule: "Dashboard/UI",
    category: "Data Not Loading",
    description: "The main dashboard shows loading spinners indefinitely. Charts and statistics are not displaying.",
    reportedBy: "clerk@domc.edu.ph",
    reportedDate: "2024-01-12",
    status: "Closed",
    priority: "Medium",
    statusHistory: [
      {
        status: "Open",
        changedBy: "System",
        changedAt: "2024-01-12T11:20:00Z",
        comment: "Incident reported",
      },
      {
        status: "In Progress",
        changedBy: "Admin User",
        changedAt: "2024-01-12T13:00:00Z",
        comment: "Investigating database connection issues",
      },
      {
        status: "Resolved",
        changedBy: "Admin User",
        changedAt: "2024-01-12T16:30:00Z",
        comment: "Fixed database timeout configuration",
      },
      {
        status: "Closed",
        changedBy: "Admin User",
        changedAt: "2024-01-13T09:00:00Z",
        comment: "Verified fix is working properly, closing ticket",
      },
    ],
  },
]

export default function IncidentLogsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(sampleIncidents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusComment, setStatusComment] = useState("")

  // Filter incidents based on search and status
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.ticketTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || incident.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const updateIncidentStatus = () => {
    if (!selectedIncident || !newStatus || newStatus === selectedIncident.status) return

    const updatedIncidents = incidents.map((incident) => {
      if (incident.id === selectedIncident.id) {
        const newStatusHistory: StatusHistory = {
          status: newStatus as "Open" | "In Progress" | "Resolved" | "Closed",
          changedBy: "Admin User", // In a real app, this would be the current user
          changedAt: new Date().toISOString(),
          comment: statusComment || undefined,
        }

        return {
          ...incident,
          status: newStatus as "Open" | "In Progress" | "Resolved" | "Closed",
          statusHistory: [...incident.statusHistory, newStatusHistory],
        }
      }
      return incident
    })

    setIncidents(updatedIncidents)

    // Update selected incident to reflect changes
    const updatedIncident = updatedIncidents.find((inc) => inc.id === selectedIncident.id)
    if (updatedIncident) {
      setSelectedIncident(updatedIncident)
    }

    // Reset form
    setNewStatus("")
    setStatusComment("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "Closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
      <div className="flex flex-col gap-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Incident Logs</h2>
          <p className="text-gray-500">View and manage reported issues or anomalies in the system</p>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search incidents by title, ID, or reporter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-[#333]">
              Reported Incidents ({filteredIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <AlertTriangle className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No incidents found</h3>
                <p className="text-gray-500 max-w-md">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No incidents have been reported yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <div key={incident.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-[#333]">{incident.id}</span>
                          <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                          <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg text-[#333] mb-1">{incident.ticketTitle}</h3>
                        <p className="text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {incident.reportedBy}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(incident.reportedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            {incident.affectedModule}
                          </div>
                          {incident.attachments && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4" />
                              {incident.attachments.length} attachment(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident)
                          setNewStatus(incident.status)
                          setStatusComment("")
                        }}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incident Detail Modal */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#5C8E77]" />
                Incident Details - {selectedIncident?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedIncident && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status Update Section */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-800">Update Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Current Status</label>
                          <Badge className={getStatusColor(selectedIncident.status)}>{selectedIncident.status}</Badge>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">New Status</label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Comment (Optional)</label>
                        <Textarea
                          placeholder="Add a comment about this status change..."
                          value={statusComment}
                          onChange={(e) => setStatusComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        onClick={updateIncidentStatus}
                        disabled={!newStatus || newStatus === selectedIncident.status}
                        className="bg-[#5C8E77] hover:bg-[#4a7063]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Incident Information */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                        <Badge className={getPriorityColor(selectedIncident.priority)}>
                          {selectedIncident.priority}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Ticket Title</label>
                      <Input value={selectedIncident.ticketTitle} readOnly />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Affected Module</label>
                      <Select value={selectedIncident.affectedModule} disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(moduleCategories).map((module) => (
                            <SelectItem key={module} value={module}>
                              {module}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Category / Issue Type</label>
                      <Select value={selectedIncident.category} disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleCategories[selectedIncident.affectedModule as keyof typeof moduleCategories]?.map(
                            (category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <Textarea value={selectedIncident.description} readOnly className="min-h-[100px]" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Reported by</label>
                      <Input value={selectedIncident.reportedBy} readOnly />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Reported Date</label>
                      <Input value={new Date(selectedIncident.reportedDate).toLocaleDateString()} readOnly />
                    </div>

                    {/* Attachments */}
                    {selectedIncident.attachments && selectedIncident.attachments.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Attachments</label>
                        <div className="space-y-2">
                          {selectedIncident.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{attachment}</span>
                              <Button variant="ghost" size="sm" className="ml-auto text-[#5C8E77]">
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status History - Right Column */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Status History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedIncident.statusHistory.map((history, index) => (
                          <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getStatusColor(history.status)} variant="outline">
                                {history.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              by <span className="font-medium">{history.changedBy}</span>
                            </p>
                            <p className="text-xs text-gray-500 mb-2">{formatDate(history.changedAt)}</p>
                            {history.comment && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-wrap break-words">
                                {history.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
