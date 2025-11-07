"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Calendar, User, AlertTriangle, Clock, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AdminTicketDetailsModal } from "./AdminTicketDetailsModal"

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

const STATUS_TABS = [
  { label: "All", dbStatus: null },
  { label: "Pending", dbStatus: "Pending" },
  { label: "In Progress", dbStatus: "In Progress" },
  { label: "Completed", dbStatus: "Resolved" },
  { label: "Cancelled", dbStatus: "Cancelled" },
] as const

type ActiveTabLabel = typeof STATUS_TABS[number]["label"]

export default function IncidentLogsPage() {
  const { toast } = useToast()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [incidentNotes, setIncidentNotes] = useState<IncidentNote[]>([])
  const [incidentAttachments, setIncidentAttachments] = useState<IncidentAttachment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTabLabel, setActiveTabLabel] = useState<ActiveTabLabel>("All") 
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const activeDBStatus = STATUS_TABS.find(t => t.label === activeTabLabel)?.dbStatus

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
      
      const [notesResponse, attachmentsResponse] = await Promise.all([
        fetch(`/api/incidents?type=notes&incident_id=${incidentId}`),
        fetch(`/api/incidents?type=attachments&incident_id=${incidentId}`)
      ])

      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        console.log('✅ Notes fetched:', notesData.notes?.length || 0)
        setIncidentNotes(notesData.notes || [])
      }
      
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json()
        console.log('✅ Attachments fetched:', attachmentsData.attachments?.length || 0)
        setIncidentAttachments(attachmentsData.attachments || [])
      }
    } catch (error) {
      console.error('❌ Error fetching incident details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const getPriorityValue = (priority: string): number => {
    switch (priority.toLowerCase()) {
      case "high priority":
      case "high":
        return 3
      case "medium priority":
      case "medium":
        return 2
      case "low priority":
      case "low":
        return 1
      default:
        return 0
    }
  }

  const sortIncidents = (incidentsToSort: Incident[], status: string | null): Incident[] => {
    if (status === "Resolved" || status === "Cancelled" || status === null) {
      return [...incidentsToSort].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    } else {
      return [...incidentsToSort].sort((a, b) => {
        const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority)
        if (priorityDiff !== 0) return priorityDiff
        return b.derived_severity_score - a.derived_severity_score
      })
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reporter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.ticket_num.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = activeDBStatus === null || incident.status === activeDBStatus
    
    return matchesSearch && matchesStatus
  })

  const sortedIncidents = sortIncidents(filteredIncidents, activeDBStatus)

  const totalPages = Math.ceil(sortedIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedIncidents = sortedIncidents.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeTabLabel, itemsPerPage])

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

  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'Pending').length,
    inProgress: incidents.filter(i => i.status === 'In Progress').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    cancelled: incidents.filter(i => i.status === 'Cancelled').length,
  }

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident)
    fetchIncidentDetails(incident.incident_id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedIncident(null)
  }

  const handleIncidentUpdated = async () => {
    await fetchIncidents()
    if (selectedIncident) {
      await fetchIncidentDetails(selectedIncident.incident_id)
      const updatedIncident = incidents.find(i => i.incident_id === selectedIncident.incident_id)
      if (updatedIncident) {
        setSelectedIncident(updatedIncident)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Incident Logs</h2>
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

      {/* Search Filter */}
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
            
            <div className="flex items-center gap-2 ml-auto">
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
          <div className="flex justify-between items-start">
                <div className="flex flex-col gap-3">
              <CardTitle className="text-xl font-semibold text-[#333]">
                Incidents
              </CardTitle>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                {STATUS_TABS.map((tab) => {
                  const count = tab.dbStatus === null 
                    ? incidents.length 
                    : incidents.filter(i => i.status === tab.dbStatus).length
                  const isActive = activeTabLabel === tab.label

                  return (
                    <Button
                      key={tab.label}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={isActive ? "bg-[#5C8E77] hover:bg-[#4a7a63]" : ""}
                      onClick={() => setActiveTabLabel(tab.label)}
                    >
                      {tab.label}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-500">
                {sortedIncidents.length > 0 && (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, sortedIncidents.length)} of {sortedIncidents.length}</>
                )}
              </div>
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
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : `No ${activeTabLabel.toLowerCase()} incidents at the moment.`}
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
                      onClick={() => handleViewIncident(incident)}
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

        {!loading && sortedIncidents.length > 0 && (
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

      {selectedIncident && (
        <AdminTicketDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          incident={selectedIncident}
          notes={incidentNotes}
          attachments={incidentAttachments}
          onUpdate={handleIncidentUpdated}
        />
      )}

      <Toaster />
    </div>
  )
}