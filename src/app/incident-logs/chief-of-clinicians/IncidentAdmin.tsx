"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Calendar, User, AlertTriangle, Clock, Save, RefreshCw, Paperclip, Download, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Incident {
  incident_id: string
  ticket_num: string
  title: string
  reporter_user_id: string
  reporter_email: string
  assignee_user_id?: string
  assignee_user_email?: string
  module_id: string
  module_name: string
  issue_type_id: string
  issue_type_name: string
  severity_id: string
  severity_name: string
  derived_severity_score: number
  requires_manual_severity_review: boolean
  status: "Pending" | "In Progress" | "Resolved" | "Cancelled"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  description: string
  submitted_at: string
  updated_at: string
  resolved_at?: string
}

interface IncidentNote {
  note_id: string
  incident_id: string
  author_user_id: string
  body: string
  note_type: string
  created_at: string
}

interface IncidentAttachment {
  attachment_id: string
  incident_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_url: string
  uploaded_by_user_id: string
  uploaded_at: string
}

export default function IncidentLogsPage() {
  const { toast } = useToast()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [incidentNotes, setIncidentNotes] = useState<IncidentNote[]>([])
  const [incidentAttachments, setIncidentAttachments] = useState<IncidentAttachment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusComment, setStatusComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      console.log('🔥 Fetching incidents...')
      
      const response = await fetch('/api/incidents')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch incidents')
      }

      const data = await response.json()
      console.log('✅ Incidents fetched:', data.count)
      
      setIncidents(data.incidents || [])
    } catch (error) {
      console.error('❌ Error fetching incidents:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load incidents. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchIncidentDetails = async (incidentId: string) => {
    try {
      setLoadingDetails(true)
      
      // Fetch notes
      const notesResponse = await fetch(`/api/incidents/notes?incident_id=${incidentId}`)
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        setIncidentNotes(notesData.notes || [])
      }
      
      // Fetch attachments
      const attachmentsResponse = await fetch(`/api/incidents/attachments?incident_id=${incidentId}`)
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json()
        setIncidentAttachments(attachmentsData.attachments || [])
      }
    } catch (error) {
      console.error('❌ Error fetching incident details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reporter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.ticket_num.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || incident.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const updateIncidentStatus = async () => {
    if (!selectedIncident || !newStatus || newStatus === selectedIncident.status) {
      toast({
        title: "No changes",
        description: "Please select a different status to update.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUpdating(true)
      console.log('🔥 Updating incident status:', selectedIncident.incident_id)

      const response = await fetch('/api/incidents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: selectedIncident.incident_id,
          status: newStatus,
          note_body: statusComment.trim() || `Status changed from ${selectedIncident.status} to ${newStatus}`,
          note_type: 'status_change',
          author_user_id: selectedIncident.reporter_user_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update incident')
      }

      const result = await response.json()
      console.log('✅ Incident updated successfully', result)

      toast({
        title: "Success",
        description: "Incident status updated successfully"
      })

      await fetchIncidents()
      await fetchIncidentDetails(selectedIncident.incident_id)

      setNewStatus("")
      setStatusComment("")
      
      // Update selected incident
      const updatedIncident = incidents.find(i => i.incident_id === selectedIncident.incident_id)
      if (updatedIncident) {
        setSelectedIncident({...updatedIncident, status: newStatus as any})
      }
    } catch (error) {
      console.error('❌ Error updating incident:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update incident. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "in progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "resolved":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      case "cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high priority":
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "medium priority":
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "low priority":
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Incident Logs</h2>
          <p className="text-gray-500">View and manage reported issues or anomalies in the system</p>
        </div>
        <Button onClick={fetchIncidents} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-[#333]">
            Reported Incidents ({filteredIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredIncidents.length === 0 ? (
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
                <div key={incident.incident_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-[#333]">{incident.ticket_num}</span>
                        <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                        <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                        {incident.requires_manual_severity_review && (
                          <Badge variant="destructive">Manual Review Required</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg text-[#333] mb-1">{incident.title}</h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {incident.reporter_email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(incident.submitted_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {incident.module_name}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIncident(incident)
                        setNewStatus(incident.status)
                        setStatusComment("")
                        fetchIncidentDetails(incident.incident_id)
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

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#5C8E77]" />
              Incident Details - {selectedIncident?.ticket_num}
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
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                      disabled={!newStatus || newStatus === selectedIncident.status || isUpdating}
                      className="bg-[#5C8E77] hover:bg-[#4a7063]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdating ? "Updating..." : "Update Status"}
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
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Severity</label>
                      <p className="text-gray-900">{selectedIncident.severity_name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ticket Title</label>
                    <Input value={selectedIncident.title} readOnly />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Affected Module</label>
                    <Input value={selectedIncident.module_name} readOnly />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category / Issue Type</label>
                    <Input value={selectedIncident.issue_type_name} readOnly />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                    <Textarea value={selectedIncident.description} readOnly className="min-h-[100px]" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Reported by</label>
                    <Input value={selectedIncident.reporter_email} readOnly />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Reported Date</label>
                    <Input value={formatDate(selectedIncident.submitted_at)} readOnly />
                  </div>

                  {selectedIncident.resolved_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Resolved At</label>
                      <Input value={formatDate(selectedIncident.resolved_at)} readOnly />
                    </div>
                  )}

                  {selectedIncident.assignee_user_email && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Assigned To</label>
                      <Input value={selectedIncident.assignee_user_email} readOnly />
                    </div>
                  )}

                  {/* Attachments Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Attachments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingDetails ? (
                        <p className="text-sm text-gray-500">Loading attachments...</p>
                      ) : incidentAttachments.length === 0 ? (
                        <p className="text-sm text-gray-500">No attachments</p>
                      ) : (
                        <div className="space-y-2">
                          {incidentAttachments.map((attachment) => (
                            <div key={attachment.attachment_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{attachment.file_name}</span>
                                <span className="text-xs text-gray-500">({formatFileSize(attachment.file_size)})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.storage_url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Status History - Right Column */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Status History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loadingDetails ? (
                      <p className="text-sm text-gray-500">Loading history...</p>
                    ) : incidentNotes.length === 0 ? (
                      <p className="text-sm text-gray-500">No status history</p>
                    ) : (
                      <div className="space-y-3">
                        {incidentNotes
                          .filter(note => note.note_type === 'status_change' || note.note_type === 'system')
                          .map((note) => {
                            // Extract status from note body
                            const statusMatch = note.body.match(/to\s+(.+)$/i)
                            const status = statusMatch ? statusMatch[1] : note.body
                            
                            return (
                              <div key={note.note_id} className="border-l-2 border-gray-200 pl-3">
                                <Badge className={getStatusColor(status)}>
                                  {status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(note.created_at)}
                                </p>
                                <p className="text-sm text-gray-700 mt-1">{note.body}</p>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}