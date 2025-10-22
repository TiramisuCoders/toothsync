// app/support/my-tickets/MyTickets.tsx
"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Copy, X, FileText, MessageSquare, Paperclip } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  visibility: 'public' | 'internal'
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

// Integrated Modal Component
function TicketDetailsModal({ 
  isOpen, 
  onClose, 
  ticket, 
  onTicketUpdated 
}: { 
  isOpen: boolean
  onClose: () => void
  ticket: Ticket
  onTicketUpdated: () => void
}) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "attachments">("details")
  const [selectedStatus, setSelectedStatus] = useState<string>(ticket.status)
  const [noteBody, setNoteBody] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  if (!isOpen) return null

  const handleUpdateTicket = async () => {
    try {
      setIsUpdating(true)

      // Check if there are actual changes
      const hasStatusChange = selectedStatus !== ticket.status
      const hasNote = noteBody.trim().length > 0

      if (!hasStatusChange && !hasNote) {
        toast({
          title: "No Changes",
          description: "Please update the status or add a note.",
          variant: "destructive"
        })
        setIsUpdating(false)
        return
      }

      console.log('🔥 Updating ticket:', {
        incident_id: ticket.incident_id,
        status: hasStatusChange ? selectedStatus : undefined,
        note_body: hasNote ? noteBody.trim() : undefined,
        note_type: 'comment'
      })

      const updateData: any = {
        incident_id: ticket.incident_id
      }

      if (hasStatusChange) {
        updateData.status = selectedStatus
      }

      if (hasNote) {
        updateData.note_body = noteBody.trim()
        updateData.note_type = 'comment'
      }

      const response = await fetch('/api/support/MyTickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to update ticket')
      }

      console.log('✅ Ticket updated successfully')

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      })

      setNoteBody("")
      onTicketUpdated()

      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      console.error('❌ Error updating ticket:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadAttachment = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('incident_id', ticket.incident_id)
      formData.append('uploaded_by_user_id', ticket.reporter_user_id)

      console.log('📤 Uploading file:', selectedFile.name)

      const response = await fetch('/api/support/MyTickets', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to upload file')
      }

      console.log('✅ File uploaded successfully')

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      setSelectedFile(null)
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      onTicketUpdated()

    } catch (error) {
      console.error('❌ Error uploading file:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{ticket.title}</h2>
            <p className="text-emerald-100 mt-1">{ticket.ticket_num}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-emerald-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Incident Details */}
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
                  <p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted</label>
                    <p className="text-gray-800 mt-1">{new Date(ticket.submitted_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated</label>
                    <p className="text-gray-800 mt-1">{new Date(ticket.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reported by</label>
                    <p className="text-gray-800 mt-1">{ticket.reporter_email}</p>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
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
                    <p className="text-gray-800 mt-1">{ticket.assigned_user_name || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Update Status
                    </label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Add Note
                    </label>
                    <Textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Add a note about this ticket..."
                      className="w-full min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              {ticket.notes && ticket.notes.length > 0 ? (
                ticket.notes.map((note) => (
                  <div key={note.note_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800">
                          {note.author_name || note.author_email || 'User'}
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
                ))
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
              {/* Upload Section */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <h4 className="font-medium text-gray-700 mb-3">Upload New Attachment</h4>
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

              {/* Existing Attachments */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Existing Attachments</h4>
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment) => (
                      <div key={attachment.attachment_id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Paperclip className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 break-all">{attachment.file_name}</p>
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
                              onClick={() => window.open(attachment.storage_url, '_blank')}
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Close
          </Button>
          <Button
            onClick={handleUpdateTicket}
            disabled={isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isUpdating ? "Updating..." : "Update Incident"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function MyTickets() {
  const router = useRouter()
  const { toast } = useToast()

  const [ticketNumber, setTicketNumber] = useState("")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const backgroundImages = [
    "/images/landing-page/school-1.png",
    "/images/landing-page/school-2.png"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  const handleTicketNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketNumber || !ticketNumber.trim()) {
      toast({
        title: "Invalid Ticket Number",
        description: "Please enter a valid ticket number.",
        variant: "destructive"
      })
      return
    }
    setTicketSubmitted(true)
    fetchTicket()
  }

  const fetchTicket = async () => {
    if (!ticketNumber) return
    
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔥 Fetching ticket:', ticketNumber)

      const response = await fetch(`/api/support/MyTickets?ticket_num=${encodeURIComponent(ticketNumber)}`)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Ticket not found')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ticket not found')
      }

      console.log('✅ Fetched ticket:', result.ticket)
      setTicket(result.ticket)

    } catch (error) {
      console.error('❌ Error fetching ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket'
      setError(errorMessage)
      setTicket(null)
      toast({
        title: "Ticket Not Found",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    fetchTicket()
  }

  const handleCopyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId)
    toast({
      title: "Copied!",
      description: `Ticket ID ${ticketId} copied to clipboard.`,
    })
  }

  const handleTicketUpdated = () => {
    fetchTicket()
  }

  const handleNewTicket = () => {
    router.push("/landing")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 font-poppins flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticketSubmitted) {
    return (
  <div className="min-h-screen max-h-screen relative overflow-hidden font-poppins m-0 p-0">
        {/* Background Carousel */}
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Background ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-emerald-600/60" />
            </div>
          ))}
        </div>

        <header className="fixed top-0 left-0 right-0 z-20 bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md m-0">          
          <div className="flex items-center gap-3">
            <Link href="/landing" aria-label="Go to landing page" className="flex items-center">
              <Image
                src="/images/DOMC-logo.png"
                alt="App Logo"
                width={75}
                height={75}
                className="object-contain cursor-pointer"
                priority
              />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Ticket Tracker</h1>
              <p className="text-sm text-emerald-100">Dental Clinic Laboratory Support System</p>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex items-center justify-center p-6 overflow-hidden" style={{ minHeight: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)' }}>
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Ticket</h2>
            <p className="text-gray-600 mb-6">Enter your ticket number to view status and details</p>
            
            <form onSubmit={handleTicketNumberSubmit}>
              <div className="mb-4">
                <label htmlFor="ticketNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Number
                </label>
                <Input
                  id="ticketNumber"
                  type="text"
                  placeholder="TS-2025-00001"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find your ticket number in the confirmation email
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Track Ticket"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={handleNewTicket}
                className="text-emerald-600"
              >
                Go to Landing Page
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-h-screen relative overflow-hidden font-poppins m-0 p-0">

      <header className="bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md m-0">
        <div className="flex items-center gap-3">
          <Link href="/landing" aria-label="Go to landing page" className="flex items-center">
            <Image
              src="/images/DOMC-logo.png"
              alt="App Logo"
              width={75}
              height={75}
              className="object-contain cursor-pointer"
              priority
            />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Ticket Tracker</h1>
            <p className="text-sm text-emerald-100">Tracking: {ticketNumber}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setTicketSubmitted(false)
              setTicket(null)
              setTicketNumber("")
              setError(null)
            }}
            variant="outline"
            className="bg-white text-emerald-700 hover:bg-emerald-50 border-white font-medium"
          >
            Track Another Ticket
          </Button>
          <Button
            onClick={() => router.push("/landing")}
            className="bg-emerald-600 text-white hover:bg-emerald-800 border-emerald-600 font-medium"
          >
            Go to Landing Page
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {ticket && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{ticket.title}</h2>
                  <p className="text-gray-600 mt-1">{ticket.ticket_num}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1`}>
                    {ticket.status}
                  </Badge>
                  <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1`}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Module</label>
                  <p className="text-gray-800">{ticket.affected_module_name}</p>
                </div>
                <div>
                  <label className="textsm font-medium text-gray-600">Issue Type</label>
                  <p className="text-gray-800">{ticket.issue_type_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted</label>
                  <p className="text-gray-800">{new Date(ticket.submitted_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To</label>
                  <p className="text-gray-800">{ticket.assigned_user_name || 'Unassigned'}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-800 mt-1">{ticket.description}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyTicketId(ticket.ticket_num)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Ticket ID
                </Button>
                <Button
                  onClick={() => setShowDetailsModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {ticket && (
        <TicketDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
          ticket={ticket}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
    </div>
  )
}