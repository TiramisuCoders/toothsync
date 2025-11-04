// app/support/my-tickets/MyTicket.tsx
"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { TicketDetailsModal } from "./TicketDetailsModal"
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

export default function MyTicket() {
  const router = useRouter()
  const { toast } = useToast()

  const [ticketNumber, setTicketNumber] = useState("")
  const [email, setEmail] = useState("")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
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

  useEffect(() => {
    if (!ticketSubmitted) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [ticketSubmitted])

  const handleTicketNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketNumber || !ticketNumber.trim()) {
      toast({
        title: "Invalid Ticket Number",
        description: "Please enter a valid ticket number.",
        variant: "destructive"
      })
      return
    }

    if (!email || !email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    await fetchTicket()
  }

  const fetchTicket = async () => {
    if (!ticketNumber || !email) return
    
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/support/MyTickets?ticket_num=${encodeURIComponent(ticketNumber.trim())}&user_email=${encodeURIComponent(email.trim())}`
      )
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Ticket not found')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ticket not found')
      }

      setTicket(result.ticket)
      setTicketSubmitted(true)

    } catch (error) {
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

  const handleCloseDetailsModal = (feedbackRequired: boolean = false) => {
    setShowDetailsModal(false)
    if (feedbackRequired) {
      setShowFeedbackModal(true)
    }
  }
  
  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false)
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

  if (isLoading && !ticket) {
    return (
      <div className="min-h-screen bg-gray-100 font-poppins flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticketSubmitted) {
    return (
      <div className="min-h-screen w-full overflow-hidden font-poppins">
        {/* Background Carousel */}
        <div className="fixed inset-0 -z-10">
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

        <main className="relative z-10 flex items-center justify-center p-6 h-screen">
          <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Ticket</h2>
            <p className="text-gray-600 mb-6">Enter your ticket number and email to view status and details</p>
            
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
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
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
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-700 text-white p-4 flex items-center justify-between shadow-md">
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
              setEmail("")
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

      <main className="p-6 pt-28">
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
                  <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1 hover:bg-opacity-100`}>
                    {ticket.status}
                  </Badge>
                  <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1 hover:bg-opacity-100`}>
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
            </div>
          )}
        </div>
      </main>

      {/* Ticket Details Modal - Pass reporter_user_id for external users */}
      {ticket && (
        <TicketDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
          ticket={ticket}
          userId={ticket.reporter_user_id}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
      
      {/* Feedback Modal */}
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