"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  X,
  Calendar,
  Clock,
  User,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  ImageIcon,
  File,
  MessageSquare,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TicketUpdateSuccessModal } from "./ticket-update-success-modal"
import { TicketUpdateFailureModal } from "./ticket-update-failure-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Define the IncidentNote interface based on ERD
interface IncidentNote {
  note_id: string
  incident_id: string
  author_user_id: string
  author_name: string // For display purposes
  author_email: string
  body: string
  created_at: string // ISO date string
  visibility: "public" | "internal"
  is_system: boolean
}

// Define the IncidentAttachment interface based on ERD
interface IncidentAttachment {
  attachment_id: string
  incident_id: string
  file_path: string
  file_name: string // Derived from file_path
  file_size: number
  file_type: string
  uploaded_at: string // ISO date string
  uploaded_by_user_id: string
  uploaded_by_name: string // For display purposes
  canDelete: boolean // Permission check
}

// Define the Ticket interface aligned with ERD
interface Ticket {
  incident_id: string
  ticket_num: string // This is the display number like "#TS-2025-00123"
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
  status: "Pending" | "In Progress" | "Resolved"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  description: string
  submitted_at: string // ISO date string
  updated_at: string // ISO date string
  resolved_at?: string // ISO date string
  notes: IncidentNote[]
  attachments: IncidentAttachment[]
}

interface TicketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
  onTicketUpdated: () => void
  onOpenFeedbackForm: (ticketId: string) => void
}

export function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  onTicketUpdated,
  onOpenFeedbackForm,
}: TicketDetailsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStatus, setCurrentStatus] = useState<Ticket["status"] | "">("")
  const [userNote, setUserNote] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "attachments">("details")

  // States for the new update modals
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false)
  const [showUpdateFailureModal, setShowUpdateFailureModal] = useState(false)

  // States for file upload
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [attachments, setAttachments] = useState<IncidentAttachment[]>([])
  const [notes, setNotes] = useState<IncidentNote[]>([])

  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status)
      setUserNote("")
      setShowUpdateSuccessModal(false)
      setShowUpdateFailureModal(false)
      setAttachments(ticket.attachments || [])
      setNotes(ticket.notes || [])
    }
  }, [ticket])

  if (!isOpen || !ticket) return null

  const getStatusBadgeColors = (status: Ticket["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      default:
        return ""
    }
  }

  const getPriorityBadgeColors = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "Low Priority":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      case "Medium Priority":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "High Priority":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return ""
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4 text-blue-600" />
    } else if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")) {
      return <FileText className="w-4 h-4 text-red-600" />
    } else {
      return <File className="w-4 h-4 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDateOnly = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString()
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    handleFileUpload(Array.from(files))
  }

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true)
    console.log("Uploading files for incident:", ticket.incident_id)

    try {
      // 🟢 REPLACE WITH YOUR FILE UPLOAD API LOGIC
      for (const file of files) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newAttachment: IncidentAttachment = {
          attachment_id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          incident_id: ticket.incident_id,
          file_path: `/uploads/${ticket.incident_id}/${file.name}`,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
          uploaded_by_user_id: ticket.reporter_user_id,
          uploaded_by_name: ticket.reporter_email.split("@")[0],
          canDelete: true,
        }

        setAttachments((prev) => [...prev, newAttachment])

        // Example API call (uncomment and modify when ready)
        /*
        const formData = new FormData()
        formData.append('file', file)
        formData.append('incident_id', ticket.incident_id)

        const response = await fetch('/api/incidents/attachments', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        const result = await response.json()
        setAttachments(prev => [...prev, result.attachment])
        */
      }

      toast({
        title: "Files Uploaded!",
        description: `${files.length} file(s) uploaded successfully.`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    console.log("Deleting attachment:", attachmentId)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Example API call (uncomment and modify when ready)
      /*
      const response = await fetch(`/api/incidents/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }
      */

      setAttachments((prev) => prev.filter((att) => att.attachment_id !== attachmentId))

      toast({
        title: "File Deleted",
        description: "The attachment has been removed successfully.",
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadAttachment = (attachment: IncidentAttachment) => {
    const link = document.createElement("a")
    link.href = attachment.file_path
    link.download = attachment.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleUpdateTicket = async () => {
    setIsUpdating(true)
    console.log("Updating incident:", ticket.incident_id)
    console.log("New Status:", currentStatus)
    console.log("User Note:", userNote)

    try {
      // 🔴 REMOVE THIS ENTIRE SIMULATION BLOCK WHEN CONNECTING TO DATABASE
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.3
          if (isSuccess) {
            resolve(true)
          } else {
            reject(new Error("Failed to update incident"))
          }
        }, 1500)
      })

      // Add the user note to the notes list if provided
      if (userNote.trim()) {
        const newNote: IncidentNote = {
          note_id: `note_${Date.now()}`,
          incident_id: ticket.incident_id,
          author_user_id: ticket.reporter_user_id,
          author_name: ticket.reporter_email.split("@")[0],
          author_email: ticket.reporter_email,
          body: userNote,
          created_at: new Date().toISOString(),
          visibility: "public",
          is_system: false,
        }
        setNotes((prev) => [...prev, newNote])
      }

      // Add system note for status change if status changed
      if (currentStatus !== ticket.status) {
        const systemNote: IncidentNote = {
          note_id: `note_${Date.now() + 1}`,
          incident_id: ticket.incident_id,
          author_user_id: "system",
          author_name: "System",
          author_email: "system@toothsync.com",
          body: `Status changed from "${ticket.status}" to "${currentStatus}"`,
          created_at: new Date().toISOString(),
          visibility: "public",
          is_system: true,
        }
        setNotes((prev) => [...prev, systemNote])
      }

      // Example API call (uncomment and modify when ready)
      /*
      const response = await fetch(`/api/incidents/${ticket.incident_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: currentStatus,
          note: userNote.trim() ? {
            body: userNote,
            visibility: 'public',
            is_system: false
          } : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update incident');
      }

      const result = await response.json();
      console.log('Incident updated successfully:', result);
      */

      setShowUpdateSuccessModal(true)
      onTicketUpdated()
      setUserNote("") // Clear the note after successful update
    } catch (error) {
      console.error("Error updating incident:", error)
      setShowUpdateFailureModal(true)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handlers for the new update modals
  const handleUpdateModalClose = () => {
    setShowUpdateSuccessModal(false)
    setShowUpdateFailureModal(false)
    onClose()
  }

  const handleUpdateModalBackToTickets = () => {
    handleUpdateModalClose()
    router.push("/support/my-tickets")
  }

  const handleUpdateModalSubmitFeedback = () => {
    setShowUpdateSuccessModal(false)
    setShowUpdateFailureModal(false)
    onClose()
    if (ticket?.incident_id) {
      onOpenFeedbackForm(ticket.incident_id)
    }
  }

  const handleUpdateModalRetry = () => {
    setShowUpdateFailureModal(false)
  }

  // Sort notes by created_at (newest first)
  const sortedNotes = [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{ticket.title}</h2>
            <p className="text-sm text-emerald-100">{ticket.ticket_num}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close ticket details"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            {[
              { id: "details", label: "Details", icon: FileText },
              { id: "notes", label: `Notes (${notes.length})`, icon: MessageSquare },
              { id: "attachments", label: `Attachments (${attachments.length})`, icon: Paperclip },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Ticket Details */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Affected Module</p>
                      <p className="text-base text-gray-800">{ticket.affected_module_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Issue Type</p>
                      <p className="text-base text-gray-800">{ticket.issue_type_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                      <p className="text-base text-gray-800 leading-relaxed">{ticket.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Submitted: {formatDateOnly(ticket.submitted_at)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Updated: {formatDateTime(ticket.updated_at)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reported by</p>
                    <div className="flex items-center text-base text-gray-800">
                      <User className="w-4 h-4 mr-2" />
                      <span>{ticket.reporter_email}</span>
                    </div>
                  </div>
                  {ticket.resolved_at && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Resolved at</p>
                      <p className="text-base text-gray-800">{formatDateTime(ticket.resolved_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Status & Admin Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status & Priority</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1 text-sm font-medium`}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1 text-sm font-medium`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  {ticket.assigned_user_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned to</p>
                      <p className="text-base text-gray-800">{ticket.assigned_user_name}</p>
                    </div>
                  )}

                  {/* User Update Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                      <Select
                        value={currentStatus}
                        onValueChange={(value) => setCurrentStatus(value as Ticket["status"])}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Add Note</p>
                      <Textarea
                        placeholder="Add a note or update for this incident"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full min-h-[80px] resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Note History</h3>
              {sortedNotes.length > 0 ? (
                <div className="space-y-4">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.note_id}
                      className={`p-4 rounded-lg border ${
                        note.is_system
                          ? "bg-blue-50 border-blue-200"
                          : note.visibility === "internal"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {note.is_system ? (
                            <Bot className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="font-medium text-sm text-gray-900">
                            {note.is_system ? "System" : note.author_name}
                          </span>
                          {note.visibility === "internal" && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDateTime(note.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No notes yet. Add the first note to start tracking progress.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Attachments</h3>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  <span
                    className="text-emerald-600 font-medium cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Click to upload files
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC, TXT up to 10MB each</p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isUploading ? "Uploading..." : "Add Files"}
                </Button>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 ? (
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.attachment_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(attachment.file_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size)} • Uploaded by {attachment.uploaded_by_name} •{" "}
                            {formatDateTime(attachment.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {attachment.canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No attachments yet. Upload files to share additional information.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button
            onClick={handleUpdateTicket}
            disabled={isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-base font-medium"
          >
            {isUpdating ? "Updating..." : "Update Incident"}
          </Button>
        </div>
      </div>

      {/* Ticket Update Success Modal */}
      <TicketUpdateSuccessModal
        isOpen={showUpdateSuccessModal}
        onClose={handleUpdateModalClose}
        onSubmitFeedback={handleUpdateModalSubmitFeedback}
        isResolvedUpdate={currentStatus === "Resolved"}
      />

      {/* Ticket Update Failure Modal */}
      <TicketUpdateFailureModal
        isOpen={showUpdateFailureModal}
        onClose={handleUpdateModalClose}
        onRetry={handleUpdateModalRetry}
        onBackToTickets={handleUpdateModalBackToTickets}
      />
    </div>
  )
}
