"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, FileText, MessageSquare, Paperclip, AlertTriangle, ChevronDown, Star, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

// Auto-escalation issue types
const AUTO_ESCALATION_ISSUE_TYPES = [
  'ISS_ROLE_ACCESS',
  'ISS_RESOURCE_NOT_APPEARING',
  'ISS_MANUAL_OVERRIDE_FAILED',
  'ISS_INCORRECT_FORM_ACCESS',
  'ISS_TICKET_MISSING',
  'ISS_UNEXPECTED_ERROR',
  'ISS_ATTENDANCE_NOT_UPDATING',
  'ISS_DATA_INTEGRITY',
  'ISS_PERFORMANCE_LAG',
  'ISS_WRONG_SUMMARY',
  'ISS_LOGBOOK_EXPORT_FAILS'
]

interface SystemFeedback {
  feedback_id: string
  incident_id: string
  user_id: string
  overall_experience: string
  support_responsiveness: string
  issue_resolved: string
  additional_comments: string | null
  submitted_at: string
}

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
  escalated_to_support?: boolean
  escalated_at?: string
}

interface IncidentNote {
  note_id: string
  incident_id: string
  author_user_id: string
  author_name?: string
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

interface AssignableUser {
  user_id: string
  name: string
  email: string
}

interface AdminTicketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  incident: Incident
  notes: IncidentNote[]
  attachments: IncidentAttachment[]
  onUpdate: () => void
}

const getStatusBadgeColors = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "In Progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "Resolved":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    case "Cancelled":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const getPriorityBadgeColors = (priority: string) => {
  switch (priority) {
    case "Low Priority":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "Medium Priority":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "High Priority":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const getRatingBadgeColors = (rating: string) => {
  const normalized = rating.toLowerCase().trim()
  if (normalized.includes("excellent") || normalized.includes("completely")) {
    return "bg-green-100 text-green-800 hover:bg-opacity-100"
  }
  if (normalized.includes("good") || normalized.includes("fair") || normalized.includes("partially")) {
    return "bg-yellow-100 text-yellow-800 hover:bg-opacity-100"
  }
  if (normalized.includes("poor") || normalized.includes("not resolved") || normalized.includes("very poor")) {
    return "bg-red-100 text-red-800 hover:bg-opacity-100"
  }
  return "bg-gray-100 text-gray-800 hover:bg-opacity-100"
}

export function AdminTicketDetailsModal({
  isOpen,
  onClose,
  incident,
  notes,
  attachments,
  onUpdate,
}: AdminTicketDetailsModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "attachments" | "feedback">("details")
  const [selectedStatus, setSelectedStatus] = useState<string>(incident.status)
  const [selectedPriority, setSelectedPriority] = useState<string>(incident.priority)
  const [selectedAssignee, setSelectedAssignee] = useState<string>(incident.assignee_user_id || "unassigned")
  const [noteBody, setNoteBody] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mounted, setMounted] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showResolveConfirm, setShowResolveConfirm] = useState(false)
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false)
  const [isEscalating, setIsEscalating] = useState(false)
  const [adminUserId, setAdminUserId] = useState<string | null>(null)
  
  const [feedback, setFeedback] = useState<SystemFeedback | null>(null)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const getAdminUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setAdminUserId(session.user.id)
      }
    }
    getAdminUser()
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchAssignableUsers()
      if (incident.status === "Resolved" || incident.status === "Cancelled") {
        fetchFeedback(incident.incident_id)
      }
    } else {
      document.body.style.overflow = 'unset'
      setFeedback(null)
      setActiveTab("details")
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedStatus(incident.status)
    setSelectedPriority(incident.priority)
    setSelectedAssignee(incident.assignee_user_id || "unassigned")
  }, [incident])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false)
        setPriorityDropdownOpen(false)
        setAssigneeDropdownOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const fetchFeedback = async (incidentId: string) => {
    setIsFeedbackLoading(true)
    try {
      const response = await fetch(`/api/support/user-tickets/feedback?incident_id=${incidentId}`)
      const result = await response.json()

      if (response.ok && result.success && result.feedback) {
        setFeedback(result.feedback)
      } else {
        console.error("Failed to fetch feedback:", result.error || result.details)
        setFeedback(null)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setFeedback(null)
    } finally {
      setIsFeedbackLoading(false)
    }
  }

  const fetchAssignableUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/incidents?type=assignable_users')
      if (!response.ok) throw new Error('Failed to fetch assignable users')
      
      const data = await response.json()
      setAssignableUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching assignable users:', error)
      toast({
        title: "Error",
        description: "Failed to load assignable users",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  if (!isOpen || !mounted) return null
  
  const isResolved = incident.status === "Resolved"
  const isCancelled = incident.status === "Cancelled"
  const isFinalized = isResolved || isCancelled
  const isAutoEscalated = AUTO_ESCALATION_ISSUE_TYPES.includes(incident.issue_type_id)
  const canEscalate = !isAutoEscalated && !isFinalized && !incident.escalated_to_support

  const handleEscalateToSupport = async () => {
    try {
      setIsEscalating(true)
      
      const response = await fetch("/api/incidents/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incident.incident_id,
          escalated_by_user_id: adminUserId || 'admin'
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to escalate incident")
      }

      toast({ 
        title: "Success", 
        description: "Incident escalated to Support Team successfully" 
      })
      
      await onUpdate()
      
    } catch (error) {
      console.error("Error escalating incident:", error)
      toast({
        title: "Escalation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsEscalating(false)
      setShowEscalateConfirm(false)
    }
  }

  const handleUpdateIncident = async (confirmResolve: boolean = false) => {
    const hasStatusChange = selectedStatus !== incident.status
    const hasPriorityChange = selectedPriority !== incident.priority
    const hasAssigneeChange = selectedAssignee !== (incident.assignee_user_id || "unassigned")
    const hasNote = noteBody.trim().length > 0

    if (!hasStatusChange && !hasPriorityChange && !hasAssigneeChange && !hasNote) {
      toast({
        title: "No Changes",
        description: "Please make changes or add a note before updating.",
        variant: "destructive",
      })
      return
    }
    
    if (incident.status === "Cancelled" && (hasStatusChange || hasPriorityChange || hasAssigneeChange)) {
      toast({
        title: "Action Blocked",
        description: "Cancelled incidents cannot be updated.",
        variant: "destructive",
      })
      return
    }

    if (hasStatusChange && selectedStatus === "Resolved" && !confirmResolve) {
      setShowResolveConfirm(true)
      // 🐛 FIX: Resetting isUpdating so the button is not disabled when AlertDialog is shown
      setIsUpdating(false); 
      return
    }

    try {
      setIsUpdating(true)
      const updateData: any = { 
        incident_id: incident.incident_id,
        author_user_id: adminUserId || 'admin'
      }
      
      if (hasStatusChange) updateData.status = selectedStatus
      if (hasPriorityChange) updateData.priority = selectedPriority
      if (hasAssigneeChange) {
        updateData.assignee_user_id = selectedAssignee === "unassigned" ? null : selectedAssignee
      }
      if (hasNote) {
        updateData.note_body = noteBody.trim()
        updateData.note_type = "comment"
      }

      const response = await fetch("/api/incidents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to update incident")
      }

      toast({ 
        title: "Success", 
        description: `Incident updated successfully. ${result.changes?.join(', ') || 'Changes applied'}` 
      })
      
      await onUpdate()
      setNoteBody("")
      
    } catch (error) {
      console.error("Error updating incident:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setShowResolveConfirm(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0])
  }

  const handleUploadAttachment = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("incident_id", incident.incident_id)
      formData.append("uploaded_by_user_id", adminUserId || "admin")

      const response = await fetch("/api/incidents", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to upload file")
      }

      toast({ title: "Success", description: "File uploaded successfully" })
      setSelectedFile(null)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ""
      await onUpdate()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getAssigneeName = () => {
    if (loadingUsers) return 'Loading...'
    if (selectedAssignee === 'unassigned') return 'Unassigned'
    
    const assignee = assignableUsers.find(u => u.user_id === selectedAssignee)
    return assignee ? assignee.name : (incident.assignee_user_email || 'Select assignee')
  }

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={onClose}
          style={{ zIndex: 1 }}
        />
        
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{ zIndex: 50 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="border-b border-gray-200 bg-white p-6 pr-16">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{incident.ticket_num}</h2>
                  <Badge className={getStatusBadgeColors(incident.status)}>{incident.status}</Badge>
                  <Badge className={getPriorityBadgeColors(incident.priority)}>{incident.priority}</Badge>
                  {incident.requires_manual_severity_review && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Manual Review Required
                    </Badge>
                  )}
                  {isAutoEscalated && (
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                      Auto-Escalated
                    </Badge>
                  )}
                  {incident.escalated_to_support && (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                      Escalated to Support
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg text-gray-700 font-medium">{incident.title}</h3>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-white">
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === "details"
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Details
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === "notes"
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Notes ({notes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("attachments")}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === "attachments"
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Paperclip className="w-4 h-4" />
                Attachments ({attachments?.length || 0})
              </button>
              {isFinalized && (
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                    activeTab === "feedback"
                      ? "text-emerald-700 border-b-2 border-emerald-700"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Feedback
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "details" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Affected Module</label>
                      <p className="text-gray-800 mt-1">{incident.module_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Issue Type</label>
                      <p className="text-gray-800 mt-1">{incident.issue_type_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Severity</label>
                      <p className="text-gray-800 mt-1">{incident.severity_name} (Score: {incident.derived_severity_score})</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reporter</label>
                      <p className="text-gray-800 mt-1">{incident.reporter_email}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-800 mt-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {incident.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submitted</label>
                      <p className="text-gray-800 mt-1 text-sm">
                        {new Date(incident.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-gray-800 mt-1 text-sm">
                        {new Date(incident.updated_at).toLocaleString()}
                      </p>
                    </div>
                    {incident.resolved_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Resolved</label>
                        <p className="text-gray-800 mt-1 text-sm">
                          {new Date(incident.resolved_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Management</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative dropdown-container">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Status
                      </label>
                      <button
                        type="button"
                        onClick={() => !isCancelled && setStatusDropdownOpen(!statusDropdownOpen)}
                        disabled={isCancelled}
                        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm ${
                          isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <span>{selectedStatus}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {statusDropdownOpen && !isCancelled && (
                        <div className="absolute z-[100000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {/* 🟢 MODIFIED: Removed "Resolved" status */}
                          {["Pending", "In Progress", "Cancelled"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setSelectedStatus(status)
                                setStatusDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative dropdown-container">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Priority
                      </label>
                      <button
                        type="button"
                        onClick={() => !isCancelled && setPriorityDropdownOpen(!priorityDropdownOpen)}
                        disabled={isCancelled}
                        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm ${
                          isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <span>{selectedPriority}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {priorityDropdownOpen && !isCancelled && (
                        <div className="absolute z-[100000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {["Low Priority", "Medium Priority", "High Priority"].map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => {
                                setSelectedPriority(priority)
                                setPriorityDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            >
                              {priority}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative dropdown-container">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Assign To
                      </label>
                      <button
                        type="button"
                        onClick={() => !isCancelled && !loadingUsers && setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                        disabled={isCancelled || loadingUsers}
                        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm ${
                          isCancelled || loadingUsers ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <span>{getAssigneeName()}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {assigneeDropdownOpen && !isCancelled && (
                        <div className="absolute z-[100000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignee('unassigned')
                              setAssigneeDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b"
                          >
                            Unassigned
                          </button>
                          {assignableUsers.map((user) => (
                            <button
                              key={user.user_id}
                              type="button"
                              onClick={() => {
                                setSelectedAssignee(user.user_id)
                                setAssigneeDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            >
                              {user.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Add Note
                    </label>
                    <Textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder={isCancelled ? "This incident is cancelled. Cannot add notes." : "Add a comment or update about this incident..."}
                      className="w-full min-h-[100px]"
                      disabled={isCancelled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can add notes to communicate with the reporter, even without changing status/priority
                    </p>
                  </div>
                  
                  {isFinalized && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        This incident is {incident.status.toLowerCase()} and cannot be modified.
                      </p>
                    </div>
                  )}

                  {isAutoEscalated && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        This incident was automatically escalated to the Support Team due to its critical nature.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes History</h3>
                {notes?.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.note_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800">
                              {note.author_name || note.author_user_id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{note.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">No notes yet</p>
                    <p className="text-sm mt-1">Comments will appear here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New Attachment</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        onChange={handleFileSelect}
                        className="flex-1"
                        disabled={isUploading}
                      />
                      <Button
                        onClick={handleUploadAttachment}
                        disabled={!selectedFile || isUploading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attached Files</h3>
                  {attachments?.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.attachment_id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Paperclip className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 break-all">
                                  {attachment.file_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-500">
                                    {formatFileSize(attachment.file_size)}
                                  </span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-sm text-gray-500">
                                    {attachment.file_type}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  Uploaded {new Date(attachment.uploaded_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(attachment.storage_url, "_blank")}
                                className="whitespace-nowrap"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No attachments yet</p>
                      <p className="text-sm mt-1">Upload files related to this incident</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "feedback" && isFinalized && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Reporter Feedback</h3>
                {isFeedbackLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-emerald-600 rounded-full"></span>
                    <p className="mt-2">Loading feedback...</p>
                  </div>
                ) : feedback ? (
                  <div className="bg-gray-50 rounded-lg p-6 border space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">Overall Experience</p>
                        <Badge className={`${getRatingBadgeColors(feedback.overall_experience)} px-3 py-1`}>
                          {feedback.overall_experience}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">Issue Resolution</p>
                        <Badge className={`${getRatingBadgeColors(feedback.issue_resolved)} px-3 py-1`}>
                          {feedback.issue_resolved}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">Support Responsiveness</p>
                        <Badge className={`${getRatingBadgeColors(feedback.support_responsiveness)} px-3 py-1`}>
                          {feedback.support_responsiveness}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <p className="font-medium text-gray-700 mb-2">Additional Comments</p>
                      <p className="text-gray-800 bg-white p-3 rounded border border-gray-200 min-h-[80px] whitespace-pre-wrap">
                        {feedback.additional_comments || "No comments provided."}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500 border-t pt-3 mt-4">
                      <p>Submitted on: {new Date(feedback.submitted_at).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <Star className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No feedback found for this incident.</p>
                    <p className="text-sm mt-1">
                      The reporter has not yet submitted feedback for this {incident.status.toLowerCase()} incident.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
            <div>
              {canEscalate && (
                <Button
                  onClick={() => setShowEscalateConfirm(true)}
                  disabled={isEscalating}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {isEscalating ? "Escalating..." : "Escalate to Support Team"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateIncident()}
                disabled={isUpdating || isCancelled}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isUpdating ? "Updating..." : "Update Incident"}
              </Button>
            </div>
          </div>

          <AlertDialog open={showResolveConfirm} onOpenChange={setShowResolveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Confirm Resolution
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark this incident as **Resolved**? Please confirm that all necessary actions have been taken.
                  This action will also apply any changes to priority, assignment, and include the added note.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowResolveConfirm(false)}>
                  Go Back
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleUpdateIncident(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Resolve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showEscalateConfirm} onOpenChange={setShowEscalateConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Escalate to Support Team
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to escalate this incident to the Support Team? This will send all ticket details to the support team for assistance. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowEscalateConfirm(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleEscalateToSupport}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Confirm Escalation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}