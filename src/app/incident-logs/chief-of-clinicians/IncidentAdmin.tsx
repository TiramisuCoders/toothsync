"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Calendar, User, AlertTriangle, Clock, Save, RefreshCw, Paperclip, ExternalLink, History, ChevronLeft, ChevronRight, FileText } from "lucide-react"
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      console.log('🔥 Fetching details for incident:', incidentId)
      
      // Fetch notes
      const notesResponse = await fetch(`/api/incidents?type=notes&incident_id=${incidentId}`)
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        console.log('✅ Notes fetched:', notesData.notes?.length || 0)
        setIncidentNotes(notesData.notes || [])
      } else {
        console.error('❌ Failed to fetch notes:', notesResponse.status)
      }
      
      // Fetch attachments
      const attachmentsResponse = await fetch(`/api/incidents?type=attachments&incident_id=${incidentId}`)
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json()
        console.log('✅ Attachments fetched:', attachmentsData.attachments?.length || 0)
        setIncidentAttachments(attachmentsData.attachments || [])
      } else {
        console.error('❌ Failed to fetch attachments:', attachmentsResponse.status)
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, itemsPerPage])

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

  // Dashboard stats
  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'Pending').length,
    inProgress: incidents.filter(i => i.status === 'In Progress').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    cancelled: incidents.filter(i => i.status === 'Cancelled').length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Admin Incident Logs</h2>
          <p className="text-gray-500">View and manage reported issues or anomalies in the system</p>
        </div>
        <Button onClick={fetchIncidents} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border border-yellow-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border border-blue-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">In Progress</p>
                <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border border-emerald-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Resolved</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.resolved}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-[#333]">
              Reported Incidents ({filteredIncidents.length})
            </CardTitle>
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredIncidents.length)} of {filteredIncidents.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : paginatedIncidents.length === 0 ? (
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
              {paginatedIncidents.map((incident) => (
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

        {/* Pagination Controls */}
        {!loading && filteredIncidents.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Incident Detail Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-[#5C8E77] rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Incident Details</h2>
                <p className="text-sm text-gray-500 font-normal">{selectedIncident?.ticket_num}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Main Details - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Update Section */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg">
                  <CardHeader className="pb-3 border-b border-blue-200">
                    <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Update Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-blue-900 mb-2 block">Current Status</label>
                        <div className="p-3 bg-white rounded-lg border border-blue-200">
                          <Badge className={getStatusColor(selectedIncident.status) + " text-sm"}>
                            {selectedIncident.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-900 mb-2 block">New Status</label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="bg-white border-blue-200">
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
                      <label className="text-sm font-semibold text-blue-900 mb-2 block">Comment (Optional)</label>
                      <Textarea
                        placeholder="Add a comment about this status change..."
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        className="min-h-[80px] bg-white border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <Button
                      onClick={updateIncidentStatus}
                      disabled={!newStatus || newStatus === selectedIncident.status || isUpdating}
                      className="w-full bg-[#5C8E77] hover:bg-[#4a7063] text-white font-semibold py-6 shadow-lg"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {isUpdating ? "Updating Status..." : "Update Status"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Incident Information */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#5C8E77]" />
                      Incident Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                        <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Priority</label>
                        <Badge className={getPriorityColor(selectedIncident.priority) + " text-sm"}>
                          {selectedIncident.priority}
                        </Badge>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Severity</label>
                        <p className="text-base font-bold text-gray-900">{selectedIncident.severity_name}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Ticket Title</label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{selectedIncident.title}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Affected Module</label>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-900">{selectedIncident.module_name}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Issue Type</label>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-900">{selectedIncident.issue_type_name}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Description</label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedIncident.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Reported By</label>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900">{selectedIncident.reporter_email}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Reported Date</label>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900">{formatDate(selectedIncident.submitted_at)}</p>
                          </div>
                        </div>
                      </div>

                      {selectedIncident.resolved_at && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Resolved At</label>
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            <p className="text-sm text-emerald-900 font-medium">{formatDate(selectedIncident.resolved_at)}</p>
                          </div>
                        </div>
                      )}

                      {selectedIncident.assignee_user_email && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">Assigned To</label>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <p className="text-sm text-blue-900 font-medium">{selectedIncident.assignee_user_email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Attachments Section */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-[#5C8E77]" />
                      Attachments ({incidentAttachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingDetails ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77]"></div>
                      </div>
                    ) : incidentAttachments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-gray-100 p-4 mb-3">
                          <Paperclip className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">No attachments</p>
                        <p className="text-xs text-gray-500 mt-1">No files have been uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incidentAttachments.map((attachment) => (
                          <div key={attachment.attachment_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-[#5C8E77] hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-[#5C8E77] bg-opacity-10 rounded-lg">
                                <Paperclip className="h-5 w-5 text-[#5C8E77]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{attachment.file_name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)} • {attachment.file_type}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attachment.storage_url, '_blank')}
                              className="flex-shrink-0 border-[#5C8E77] text-[#5C8E77] hover:bg-[#5C8E77] hover:text-white"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status History - Right Column */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-200">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <History className="h-5 w-5 text-[#5C8E77]" />
                      Status History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingDetails ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C8E77] mb-2"></div>
                        <p className="text-sm text-gray-500">Loading history...</p>
                      </div>
                    ) : incidentNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-gray-200 p-3 mb-3">
                          <History className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">No status history yet</p>
                        <p className="text-xs text-gray-500 mt-1">Status changes will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {incidentNotes
                          .filter(note => note.note_type === 'status_change' || note.note_type === 'system')
                          .map((note, index) => {
                            const statusMatch = note.body.match(/to\s+(.+)$/i)
                            const status = statusMatch ? statusMatch[1] : note.body
                            
                            return (
                              <div 
                                key={note.note_id} 
                                className="relative pl-4 pb-4 border-l-2 border-gray-300 last:border-l-0 last:pb-0"
                              >
                                {/* Timeline dot */}
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#5C8E77] border-2 border-white"></div>
                                
                                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <Badge className={getStatusColor(status) + " text-xs"}>
                                      {status}
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                      #{incidentNotes.filter(n => n.note_type === 'status_change' || n.note_type === 'system').length - index}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1 leading-relaxed">{note.body}</p>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(note.created_at)}
                                  </div>
                                </div>
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