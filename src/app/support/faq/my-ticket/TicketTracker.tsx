"use client"

import { useState, useEffect } from "react"
import { Boxes, User, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { TicketDetailsModal } from "@/app/incident-management/my-tickets/TicketDetailsModal"
import { FeedbackFormModal } from "@/components/modals/support-faq/feedback-form-modal"
import { useRouter } from "next/navigation"

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
  status: "Pending" | "In Progress" | "Resolved" | "Cancelled"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  description: string
  submitted_at: string
  updated_at: string
  resolved_at?: string
  notes: IncidentNote[]
  attachments: IncidentAttachment[]
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
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString()
}

const STATUS_TABS = [
  { label: "Pending", dbStatus: "Pending" },
  { label: "In Progress", dbStatus: "In Progress" },
  { label: "Resolved", dbStatus: "Resolved" },
  { label: "Cancelled", dbStatus: "Cancelled" },
] as const

export default function TicketTracker() {
  const router = useRouter()
  // const { toast } = useToast() // Note: useToast hook usage was removed in previous step, but not imported. Assuming you have a custom toast implementation or simply removed the display of toasts.
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"Pending" | "In Progress" | "Resolved" | "Cancelled">("Pending")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchTickets = async (email: string) => {
    try {
      const response = await fetch(`/api/support/user-tickets?user_email=${encodeURIComponent(email)}`)
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to fetch tickets")
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch tickets")
      }
      setTickets(result.tickets || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load tickets"
      console.error("❌ Error:", errorMessage)
      throw error
    }
  }

  useEffect(() => {
    const fetchUserAndTickets = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw new Error("Unable to get session: " + sessionError.message)
        if (!session || !session.user) throw new Error("No active session found. Please log in.")
        const email = session.user.email
        const userId = session.user.id
        setUserEmail(email || null)
        setUserId(userId || null)
        if (!email) throw new Error("User email not found")
        await fetchTickets(email)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load tickets"
        setError(errorMessage)
        // Removed toast call to prevent potential error if useToast is not imported
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserAndTickets()
  }, [])

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  const handleCloseDetailsModal = (feedbackRequired: boolean = false) => {
    setIsModalOpen(false)
    if (feedbackRequired && selectedTicket) {
      setShowFeedbackModal(true)
    }
  }

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false)
    if (userEmail) {
      fetchTickets(userEmail).catch(console.error)
    }
  }

  const handleTicketUpdated = async () => {
    if (!userEmail) return
    try {
      await fetchTickets(userEmail)
      if (selectedTicket) {
        const updatedTicket = tickets.find(
          (t: Ticket) => t.incident_id === selectedTicket.incident_id
        )
        if (updatedTicket) setSelectedTicket(updatedTicket)
      }
    } catch (error) {
      console.error("Error refetching tickets:", error)
    }
  }

  const handleCopyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId)
    // Removed toast call to prevent potential error if useToast is not imported
  }

  const filteredTickets = tickets.filter((ticket) => ticket.status === activeTab)

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-md">
            <h3 className="font-semibold mb-2">Error Loading Tickets</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* COMBINED Header and Status Tabs */}
        <div className="flex flex-col gap-4"> 
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#333]">My Tickets</h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/support/faq")}
              className="text-sm text-gray-600 hover:text-emerald-600"
            >
              Go back to Help/FAQ
            </Button>
          </div>

          {/* Status Tabs - Moved here and removed Card/CardContent wrapper */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.label

              return (
                <Button
                  key={tab.label}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={isActive ? "bg-[#5C8E77] hover:bg-[#4a7a63]" : ""}
                  onClick={() => setActiveTab(tab.label as any)}
                >
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>


        {/* Tickets List Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No tickets found</h3>
                <p className="text-gray-500">You don't have any {activeTab.toLowerCase()} tickets at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.incident_id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopyTicketId(ticket.ticket_num)}
                            className="font-medium text-[#333] text-sm hover:text-emerald-600 flex items-center gap-1 transition-colors"
                          >
                            {ticket.ticket_num}
                            <Copy className="w-3 h-3" />
                          </button>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(ticket.submitted_at)}</span>
                      </div>

                      <button onClick={() => handleTicketClick(ticket)} className="text-left w-full">
                        <h3 className="font-semibold text-[#333] hover:text-emerald-600 transition-colors">
                          {ticket.title}
                        </h3>
                      </button>

                      <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Boxes className="h-4 w-4 text-gray-400" />
                          <span>{ticket.affected_module_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{ticket.assigned_user_name || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseDetailsModal}
          ticket={selectedTicket}
          userId={userId}
          onTicketUpdated={handleTicketUpdated}
        />
      )}

      {selectedTicket && (
        <FeedbackFormModal
          isOpen={showFeedbackModal}
          onClose={handleCloseFeedbackModal}
          ticketId={selectedTicket.incident_id}
        />
      )}
    </>
  )
}