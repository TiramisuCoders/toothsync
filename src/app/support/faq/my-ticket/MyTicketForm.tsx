// app/support/faq/my-ticket/MyTicketForm.tsx
"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
// ⚠️ Ensure this path is correct for the Ticket Details Modal
import { TicketDetailsModal } from "@/app/incident-management/my-tickets/TicketDetailsModal" 
// 🟢 CRITICAL FIX: Import FeedbackFormModal from the new dedicated support-faq folder
import { FeedbackFormModal } from "@/components/modals/support-faq/feedback-form-modal" 

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

export default function MyTicketForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [ticketNumber, setTicketNumber] = useState("")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false) 

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

      const response = await fetch(`/api/support/MyTickets?ticket_num=${encodeURIComponent(ticketNumber)}`)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Ticket not found')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ticket not found')
      }

      setTicket(result.ticket)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket'
      setError(errorMessage)
      setTicket(null) // Only clear ticket state if the fetch genuinely failed
      toast({
        title: "Ticket Not Found",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDetailsModal = (feedbackRequired: boolean = false) => {
    setShowDetailsModal(false)
    if (feedbackRequired) {
      setShowFeedbackModal(true)
    }
  }
  
  const handleCloseFeedbackModal = () => {
      setShowFeedbackModal(false);
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

  const handleGoToFAQ = () => {
    // Link back to the FAQ page
    router.push("/support/faq")
  }

  if (isLoading && !ticket) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticketSubmitted) {
    return (
      // 🟢 Outer Container: Set the entire page area background to light gray (bg-gray-100)
      <div className="min-h-screen font-poppins bg-gray-100 pt-10">
        {/* Card: Set to white background with shadow */}
        <div className="p-8 rounded-lg bg-white shadow-lg w-full max-w-lg mx-auto">
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
              onClick={handleGoToFAQ}
              className="text-emerald-600"
            >
              Go back to Help/FAQ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    // 🟢 Outer Page Container: Set the entire page area background to light gray (bg-gray-100)
    <div className="min-h-screen font-poppins bg-gray-100"> 
      <main className="p-6 pt-10">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {ticket && (
            // 🟢 Ticket Display Card: Set to white background with shadow
            <div className="rounded-lg p-6 bg-white shadow-lg">
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
                  <label className="text-sm font-medium text-gray-600">Issue Type</label>
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
              
              <div className="mt-6">
                <Button
                  variant="link"
                  onClick={() => setTicketSubmitted(false)}
                  className="text-gray-500 hover:text-gray-700 p-0"
                >
                  Track Another Ticket
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* 1. Ticket Details Modal */}
      {ticket && (
        <TicketDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal} 
          ticket={ticket}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
      
      {/* 2. Decoupled Feedback Modal */}
      {ticket && (
        <FeedbackFormModal
          isOpen={showFeedbackModal}
          onClose={handleCloseFeedbackModal} 
          ticketId={ticket.incident_id}
        />
      )}
    </div>
  )
}