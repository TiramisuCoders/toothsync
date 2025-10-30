"use client"

import { useState } from "react"
import { X, FileText, MessageSquare, Paperclip } from "lucide-react"
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
import { FeedbackFormModal } from "@/components/modals/feedback-form-modal"

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
  status: "Pending" | "In Progress" | "Resolved"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  description: string
  submitted_at: string
  updated_at: string
  resolved_at?: string
  notes: IncidentNote[]
  attachments: IncidentAttachment[]
}

const getStatusBadgeColors = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800"
    case "In Progress":
      return "bg-blue-100 text-blue-800"
    case "Resolved":
      return "bg-emerald-100 text-emerald-800"
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


interface TicketDetailsModalProps {
  isOpen: boolean
  // onClose now accepts a requiredFeedback flag
  onClose: (feedbackRequired: boolean) => void 
  ticket: Ticket
  onTicketUpdated: () => void
}

export function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  onTicketUpdated,
}: TicketDetailsModalProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "attachments">("details")
  const [selectedStatus, setSelectedStatus] = useState<string>(ticket.status)
  const [noteBody, setNoteBody] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  if (!isOpen) return null
  
  // 🟢 DETERMINE IF TICKET IS FINALIZED (USED FOR DISABLING CONTROLS)
  const isFinalized = ticket.status === "Resolved";

  const handleUpdateTicket = async () => {
    
    const hasStatusChange = selectedStatus !== ticket.status
    const hasNote = noteBody.trim().length > 0
    const newStatus = selectedStatus;

    if (!hasStatusChange && !hasNote) {
      toast({
        title: "No Changes",
        description: "Please update the status or add a note.",
        variant: "destructive",
      })
      return
    }

    // 1. Block any status change if the ticket is ALREADY Resolved.
    if (ticket.status === "Resolved" && hasStatusChange) {
        toast({
            title: "Action Blocked",
            description: "Cannot change the status of an already resolved ticket.",
            variant: "destructive",
        });
        return;
    }

    // 2. Defer status change and trigger feedback modal if the user selects 'Resolved'.
    if (newStatus === "Resolved" && hasStatusChange) {
        // Stop API call here. Close the details modal and tell the parent to open the feedback form.
        onClose(true); 
        return;
    }
    
    // --- EXECUTE STATUS UPDATE LOGIC (For non-Resolved status changes OR for adding notes) ---
    try {
      setIsUpdating(true)
      const updateData: any = { incident_id: ticket.incident_id }
      if (hasStatusChange) updateData.status = newStatus
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

      toast({ title: "Success", description: "Ticket updated successfully" })
      setNoteBody("")
      onTicketUpdated() 
      
      // Close the modal normally after successful non-resolved update/note addition
      setTimeout(() => onClose(false), 500)

    } catch (error) {
      console.error("Error updating ticket:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      onClose(false) 
    } finally {
      setIsUpdating(false)
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
      formData.append("incident_id", ticket.incident_id)
      formData.append("uploaded_by_user_id", ticket.reporter_user_id)

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
      onTicketUpdated()
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

  return (
    <>
      {/* Main Ticket Modal - conditionally render based on isOpen */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
            {/* Call onClose with false on direct X click */}
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
                  Notes ({ticket.notes && Array.isArray(ticket.notes) ? ticket.notes.length : 0})
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
                  Attachments ({ticket.attachments && Array.isArray(ticket.attachments) ? ticket.attachments.length : 0})
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "details" && (
                <div className="space-y-6">
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

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Status & Priority</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1`}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Priority</label>
                        <div className="mt-1">
                          <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1`}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Assigned to</label>
                        <p className="text-gray-800 mt-1">{ticket.assigned_user_name || "Unassigned"}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Update Status
                        </label>
                        {/* 🟢 DISABLE STATUS SELECTOR */}
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
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Add Note</label>
                        {/* 🟢 DISABLE ADD NOTE TEXTAREA */}
                        <Textarea
                          value={noteBody}
                          onChange={(e) => setNoteBody(e.target.value)}
                          placeholder={isFinalized ? "Ticket is resolved. Cannot add notes." : "Add a note about this ticket..."}
                          className="w-full min-h-[100px]"
                          disabled={isFinalized}
                        />
                      </div>
                      
                      {/* 🟢 Display warning if finalized */}
                      {isFinalized && (
                        <p className="text-sm text-red-600 font-medium">
                          This ticket is resolved and locked for editing.
                        </p>
                      )}
                      
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  {ticket.notes && Array.isArray(ticket.notes) && ticket.notes.length > 0 ? (
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
                            {note.is_system && (
                              <Badge className="bg-blue-100 text-blue-800">System</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{note.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No notes yet</p>
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
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Existing Attachments</h4>
                    {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {ticket.attachments.map((attachment) => (
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
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <Paperclip className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No attachments yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => onClose(false)} disabled={isUpdating}>
                Close
              </Button>
              {/* 🟢 DISABLE UPDATE BUTTON */}
              <Button
                onClick={handleUpdateTicket}
                disabled={isUpdating || isFinalized}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isUpdating ? "Updating..." : "Update Incident"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}