"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, FileText, MessageSquare, Paperclip, Star, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// --- Interface Definitions ---

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

interface IncidentNote {
  note_id: string
  incident_id: string
  author_user_id: string
  author_name?: string
  author_email: string
  body: string
  created_at: string
  visibility: "public" | "internal"
  is_system: boolean
}

// Correct Feedback Interface
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

interface Ticket {
  incident_id: string
  ticket_num: string
  title: string
  reporter_user_id: string
  reporter_email: string
  assigned_user_id?: string
  assigned_user_name?: string
  affected_module_id: string
  affected_module_name: string
  issue_type_id: string
  issue_type_name: string
  severity_id: number
  severity_name: string
  derived_severity_score: number
  status: "Pending" | "In Progress" | "Resolved" | "Cancelled" 
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  description: string
  submitted_at: string
  updated_at: string
  resolved_at?: string
  notes: IncidentNote[]
  attachments: IncidentAttachment[]
}

// --- Constants ---
const SUPPORT_TEAM_EMAIL = "judeemmanuel.flores.cics@ust.edu.ph"

// --- Utility Functions ---

const getStatusBadgeColors = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800"
    case "In Progress":
      return "bg-blue-100 text-blue-800"
    case "Resolved":
      return "bg-emerald-100 text-emerald-800"
    case "Cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getPriorityBadgeColors = (priority: string) => {
  switch (priority) {
    case "Low Priority":
      return "bg-gray-100 text-gray-800"
    case "Medium Priority":
      return "bg-yellow-100 text-yellow-800"
    case "High Priority":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
  return (bytes / (1024 * 1024)).toFixed(2) + " MB"
}

// MODIFIED: Removed border color classes (border-green-300, etc.)
const getRatingBadgeColors = (rating: string) => {
  const normalized = rating.toLowerCase().trim()
  if (normalized.includes("excellent") || normalized.includes("completely")) {
    return "bg-green-100 text-green-800" // Border color removed
  }
  if (normalized.includes("good") || normalized.includes("fair") || normalized.includes("partially")) {
    return "bg-yellow-100 text-yellow-800" // Border color removed
  }
  if (normalized.includes("poor") || normalized.includes("not resolved") || normalized.includes("very poor")) {
    return "bg-red-100 text-red-800" // Border color removed
  }
  return "bg-gray-100 text-gray-800" // Border color removed
}

// --- Main Component ---

interface TicketDetailsModalProps {
  isOpen: boolean
  onClose: (feedbackRequired: boolean) => void 
  ticket: Ticket
  userId: string | null
  onTicketUpdated: () => void
}


export function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  userId,
  onTicketUpdated,
}: TicketDetailsModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "attachments" | "feedback">("details")
  const [selectedStatus, setSelectedStatus] = useState<string>(ticket.status)
  const [noteBody, setNoteBody] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // State for Feedback Tab
  const [feedback, setFeedback] = useState<SystemFeedback | null>(null)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  
  // Check if ticket is assigned to support team (R04 ticket)
  const isSupportTeamTicket = ticket.assigned_user_name?.toLowerCase().includes(SUPPORT_TEAM_EMAIL.toLowerCase())
  
  // Lock ticket if it's Resolved OR Cancelled
  const isFinalized = ticket.status === "Resolved" || ticket.status === "Cancelled"
  const finalizedReason = ticket.status === "Resolved" ? "resolved" : "cancelled"

  // --- Effects ---

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    // Reset selected status when ticket changes
    setSelectedStatus(ticket.status)
    // Reset tab when ticket changes
    setActiveTab("details")
  }, [ticket.incident_id, ticket.status])
  
  // Feedback Fetching Logic
  const fetchFeedback = useCallback(async (incidentId: string) => {
    if (ticket.status !== "Resolved" && ticket.status !== "Cancelled") return;

    setIsFeedbackLoading(true)
    try {
      const response = await fetch(`/api/support/user-tickets/feedback?incident_id=${incidentId}`)
      const result = await response.json()

      if (response.ok && result.success && result.feedback) {
        setFeedback(result.feedback)
        console.log("Feedback fetched:", result.feedback)
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
  }, [ticket.status])

  useEffect(() => {
    if (isOpen && ticket.incident_id && isFinalized) {
      fetchFeedback(ticket.incident_id)
    } else if (!isFinalized) {
      setFeedback(null)
    }
  }, [isOpen, ticket.incident_id, isFinalized, fetchFeedback])


  if (!isOpen || !mounted) return null
  
  // --- Handlers ---

  const handleUpdateTicket = async () => {
    // 🔒 CRITICAL: Block all updates to finalized tickets
    if (isFinalized) {
      toast({
        title: "Action Blocked",
        description: `Cannot modify ${finalizedReason} tickets. This ticket is locked.`,
        variant: "destructive",
      })
      return
    }

    const hasStatusChange = selectedStatus !== ticket.status
    const hasNote = noteBody.trim().length > 0

    if (!hasStatusChange && !hasNote) {
      toast({
        title: "No Changes",
        description: "Please update the status or add a note.",
        variant: "destructive",
      })
      return
    }

    if (hasStatusChange && !hasNote) {
      toast({
        title: "Note Required",
        description: "Please add a note explaining the status change.",
        variant: "destructive",
      })
      return
    }
  
    try {
      setIsUpdating(true)
      const updateData: any = { 
        incident_id: ticket.incident_id,
        author_user_id: userId
      }
      
      if (hasStatusChange) {
        updateData.status = selectedStatus
      }
      
      if (hasNote) {
        updateData.note_body = noteBody.trim()
        updateData.note_type = "comment"
      }

      const response = await fetch("/api/support/MyTickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()
      if (!response.ok || !result.success)
        throw new Error(result.error || result.details || "Failed to update ticket")

      const successMessage = hasStatusChange 
        ? "Ticket status updated successfully" 
        : "Note added successfully"
      
      toast({ title: "Success", description: successMessage })
      setNoteBody("")
      await onTicketUpdated()

      // If the ticket was resolved, close the modal and prompt for feedback
      if (selectedStatus === "Resolved" && hasStatusChange) {
        setTimeout(() => onClose(true), 500)
      }
      
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
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
      formData.append("incident_id", ticket.incident_id)
      formData.append("uploaded_by_user_id", userId || ticket.reporter_user_id)

      const response = await fetch("/api/support/MyTickets", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok || !result.success)
        throw new Error(result.error || result.details || "Failed to upload file")

      toast({ title: "Success", description: "File uploaded successfully" })
      setSelectedFile(null)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ""
      
      await onTicketUpdated()
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

  // --- Render Logic ---

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 50 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => onClose(false)}
        style={{ zIndex: 1 }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ zIndex: 2 }}
      >
        <button
          onClick={() => onClose(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white pt-4">
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
              Notes ({ticket.notes?.length || 0})
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
              Attachments ({ticket.attachments?.length || 0})
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Support Team Notice for R04 Tickets */}
              {isSupportTeamTicket && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Support Team Ticket</h3>
                    <p className="text-sm text-blue-800">
                      This ticket is being handled by our support team at{" "}
                      <span className="font-medium">{SUPPORT_TEAM_EMAIL}</span>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Affected Module</label>
                    <p className="text-gray-800 mt-1">{ticket.affected_module_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Type</label>
                    <p className="text-gray-800 mt-1">{ticket.issue_type_name}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded">
                    {ticket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted</label>
                    <p className="text-gray-800 mt-1">
                      {new Date(ticket.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated</label>
                    <p className="text-gray-800 mt-1">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reported by</label>
                    <p className="text-gray-800 mt-1">{ticket.reporter_email}</p>
                  </div>
                </div>
              </div>

              {/* --- 2. Current Status & Priority (Read-Only Overview) --- */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1 hover:bg-opacity-100`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <div className="mt-1">
                      <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1 hover:bg-opacity-100`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {isSupportTeamTicket ? "Support Team" : "Assigned to"}
                    </label>
                    <p className="text-gray-800 mt-1">
                      {isSupportTeamTicket ? SUPPORT_TEAM_EMAIL : (ticket.assigned_user_name || "Unassigned")}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* --- 3. Actions (Update Status & Add Note) --- */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Actions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Update Status
                    </label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isFinalized}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedStatus !== ticket.status && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ A note is required when changing the status
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Add Note</label>
                    <Textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder={isFinalized ? `Ticket is ${finalizedReason} and locked. Cannot add notes.` : "Add a note or update about this ticket..."}
                      className="w-full min-h-[100px]"
                      disabled={isFinalized}
                    />
                    {!isFinalized && (
                      <p className="text-xs text-gray-500 mt-1">
                        You can add notes to communicate with support without changing the status
                      </p>
                    )}
                  </div>
                  
                  {isFinalized && (
                    <p className="text-sm text-red-600 font-medium">
                      This ticket is {finalizedReason} and locked for editing.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {ticket.notes?.length > 0 ? (
                <div className="space-y-4">
                  {ticket.notes.map((note) => (
                    <div key={note.note_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800">
                            {note.author_name || note.author_email || "User"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No notes yet</p>
                  <p className="text-sm mt-1">Add a note from the Details tab to start communicating</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <h4 className="font-medium text-gray-700 mb-3">Upload New Attachment</h4>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    className="flex-1"
                    disabled={isUploading || isFinalized}
                  />
                  <Button
                    onClick={handleUploadAttachment}
                    disabled={!selectedFile || isUploading || isFinalized}
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
                {isFinalized && (
                  <p className="text-xs text-red-600 mt-2">
                    Cannot upload files to {finalizedReason} tickets
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Existing Attachments</h4>
                {ticket.attachments?.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.attachment_id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
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
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Paperclip className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No attachments yet</p>
                    <p className="text-sm mt-1">Upload files to share with support</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* UPDATED Feedback Tab Content */}
          {activeTab === "feedback" && isFinalized && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Satisfaction Feedback</h3>
              {isFeedbackLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-emerald-600 rounded-full"></span>
                  <p className="mt-2">Loading feedback...</p>
                </div>
              ) : feedback ? (
                <div className="bg-gray-50 rounded-lg p-6 border space-y-4">
                  
                  {/* Rating Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Overall Experience</p>
                      <Badge className={`${getRatingBadgeColors(feedback.overall_experience)} px-3 py-1 hover:bg-opacity-100`}>
                        {feedback.overall_experience}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Issue Resolution</p>
                      <Badge className={`${getRatingBadgeColors(feedback.issue_resolved)} px-3 py-1 hover:bg-opacity-100`}>
                        {feedback.issue_resolved}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Support Responsiveness</p>
                      <Badge className={`${getRatingBadgeColors(feedback.support_responsiveness)} px-3 py-1 hover:bg-opacity-100`}>
                        {feedback.support_responsiveness}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Comments Field */}
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
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No feedback found for this incident.</p>
                  <p className="text-sm mt-1">
                    {ticket.status === "Resolved" ? "The user may not have submitted feedback yet." : "Feedback is only requested for resolved tickets."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onClose(false)} disabled={isUpdating}>
            Close
          </Button>
          {!isFinalized && (
            <Button
              onClick={handleUpdateTicket}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}