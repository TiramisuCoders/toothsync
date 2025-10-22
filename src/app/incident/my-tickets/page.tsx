"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import Image from "next/image"
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle,
  Calendar,
  History,
  MoreHorizontal,
  Copy,
  Check,
  XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // Assuming you have a Badge component from shadcn/ui
import { useRouter } from "next/navigation"
import { TicketDetailsModal } from "@/components/modals/ticket-details-modal" // Import the new modal
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast" // Assuming you have a useToast hook
import { TicketUpdateSuccessModal } from "@/components/modals/ticket-update-success-modal" // Import update success modal
import { TicketUpdateFailureModal } from "@/components/modals/ticket-update-failure-modal" // Import update failure modal
import { FeedbackFormModal } from "@/components/modals/feedback-form-modal" // Import the new feedback form modal

// Define the IncidentAttachment interface
interface IncidentAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string // ISO date string
  downloadUrl: string
  canDelete: boolean // Permission to delete
}

// Define the IncidentNote interface
interface IncidentNote {
  note_id: string
  incident_id: string
  author_user_id: string
  author_name: string
  author_email: string
  body: string
  created_at: string // ISO date string
  visibility: string
  is_system: boolean
}

// Define the Ticket interface - UPDATED
interface Ticket {
  incident_id: string
  ticket_num: string // Display number like "#TS-2025-00123"
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

export default function MyTicketsPage() {
  const router = useRouter()
  const { toast } = useToast() // Initialize toast
  const [activeTab, setActiveTab] = useState<"All Tickets" | "Pending" | "In Progress" | "Resolved">("All Tickets")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ticketsPerPage = 5 // Number of tickets to show per page

  // State for the details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // States for the dropdown update modals
  const [showDropdownUpdateSuccessModal, setShowDropdownUpdateSuccessModal] = useState(false)
  const [showDropdownUpdateFailureModal, setShowDropdownUpdateFailureModal] = useState(false)
  const [updatedTicketIdForModal, setUpdatedTicketIdForModal] = useState<string | null>(null) // To pass to modal if needed

  // State for the feedback form modal
  const [showFeedbackFormModal, setShowFeedbackFormModal] = useState(false)
  const [feedbackTicketId, setFeedbackTicketId] = useState<string | undefined>(undefined)

  // 🔴 REMOVE THIS SAMPLE DATA WHEN CONNECTING TO DATABASE
  // 🟢 REPLACE WITH DATA FETCHED FROM YOUR DATABASE
  const [allTickets, setAllTickets] = useState<Ticket[]>(
    useMemo(
      () => [
        {
          incident_id: "inc_001",
          ticket_num: "#TS-2025-00123",
          title: "Wala po akong Instructor",
          reporter_user_id: "user_001",
          reporter_email: "johndoe@sample.com",
          assigned_user_id: "admin_001",
          assigned_user_name: "Mona Lisa",
          affected_module_id: "mod_002",
          affected_module_name: "Instructor Management",
          issue_type_id: "issue_001",
          issue_type_name: "Instructor Not Assigned",
          severity_id: 2,
          severity_name: "Medium",
          derived_severity_score: 65,
          status: "Pending",
          priority: "Medium Priority",
          description:
            "Wala pong instructor na na-assign kahit na nakapagsubmit po ako ng form. I have to perform an operation today. Need instructor ASAP.",
          submitted_at: "2025-01-15T09:35:00Z",
          updated_at: "2025-01-15T10:30:00Z",
          resolved_at: undefined,
          notes: [
            {
              note_id: "note_001",
              incident_id: "inc_001",
              author_user_id: "user_001",
              author_name: "John Doe",
              author_email: "johndoe@sample.com",
              body: "I submitted the form yesterday but still no instructor assigned. I have a patient scheduled for 2 PM today and really need help.",
              created_at: "2025-01-15T08:30:00Z",
              visibility: "public",
              is_system: false,
            },
            {
              note_id: "note_002",
              incident_id: "inc_001",
              author_user_id: "admin_001",
              author_name: "Mona Lisa",
              author_email: "mona@toothsync.com",
              body: "Hi John, I see your request. Let me check the instructor availability for today. Can you please refresh the website and try logging in again? Sometimes the assignment doesn't show immediately.",
              created_at: "2025-01-15T09:15:00Z",
              visibility: "public",
              is_system: false,
            },
            {
              note_id: "note_003",
              incident_id: "inc_001",
              author_user_id: "user_001",
              author_name: "John Doe",
              author_email: "johndoe@sample.com",
              body: "I tried refreshing and logging out/in but still no instructor showing. The patient will be here in 3 hours. Is there a manual way to assign someone?",
              created_at: "2025-01-15T09:45:00Z",
              visibility: "public",
              is_system: false,
            },
            {
              note_id: "note_004",
              incident_id: "inc_001",
              author_user_id: "system",
              author_name: "System",
              author_email: "system@toothsync.com",
              body: 'Status changed from "Pending" to "In Progress"',
              created_at: "2025-01-15T10:00:00Z",
              visibility: "public",
              is_system: true,
            },
            {
              note_id: "note_005",
              incident_id: "inc_001",
              author_user_id: "admin_001",
              author_name: "Mona Lisa",
              author_email: "mona@toothsync.com",
              body: "I've manually assigned Dr. Smith to your case. You should see the assignment now. I'm also investigating why the automatic assignment failed. Please confirm if you can see Dr. Smith in your dashboard.",
              created_at: "2025-01-15T10:05:00Z",
              visibility: "public",
              is_system: false,
            },
            {
              note_id: "note_006",
              incident_id: "inc_001",
              author_user_id: "user_001",
              author_name: "John Doe",
              author_email: "johndoe@sample.com",
              body: "Perfect! I can see Dr. Smith assigned now. Thank you so much for the quick response. The patient appointment can proceed as planned.",
              created_at: "2025-01-15T10:30:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_002",
          ticket_num: "#TS-2025-00124",
          title: "Mali po 'yung nakadisplay na name ko",
          reporter_user_id: "user_002",
          reporter_email: "janedoe@sample.com",
          assigned_user_id: "admin_002",
          assigned_user_name: "Leonardo Da Vinci",
          affected_module_id: "mod_003",
          affected_module_name: "Dashboard/UI",
          issue_type_id: "issue_002",
          issue_type_name: "Data Not Loading",
          severity_id: 2,
          severity_name: "Medium",
          derived_severity_score: 60,
          status: "In Progress",
          priority: "Medium Priority",
          description: "My name is displayed incorrectly on the dashboard. It shows 'John Doe' instead of 'Jane Doe'.",
          submitted_at: "2025-01-15T04:50:00Z",
          updated_at: "2025-01-15T05:00:00Z",
          resolved_at: undefined,
          notes: [
            {
              note_id: "note_002",
              incident_id: "inc_002",
              author_user_id: "admin_002",
              author_name: "Leonardo Da Vinci",
              author_email: "leo@toothsync.com",
              body: "Checked database, name is correct. Investigating UI rendering issue.",
              created_at: "2025-01-15T05:00:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_003",
          ticket_num: "#TS-2025-00125",
          title: "Wrong Credentials entered",
          reporter_user_id: "user_003",
          reporter_email: "user123@sample.com",
          assigned_user_id: "admin_003",
          assigned_user_name: "Raphael Sanzio",
          affected_module_id: "mod_004",
          affected_module_name: "Login & Authentication",
          issue_type_id: "issue_003",
          issue_type_name: "Unable to Log In",
          severity_id: 3,
          severity_name: "High",
          derived_severity_score: 85,
          status: "In Progress",
          priority: "High Priority",
          description:
            "I am unable to log in using my correct credentials. It keeps saying 'invalid username or password'.",
          submitted_at: "2025-01-15T08:01:00Z",
          updated_at: "2025-01-15T08:10:00Z",
          resolved_at: undefined,
          notes: [
            {
              note_id: "note_003",
              incident_id: "inc_003",
              author_user_id: "admin_003",
              author_name: "Raphael Sanzio",
              author_email: "raphael@toothsync.com",
              body: "Account locked due to multiple failed attempts. Unlocked account and sent password reset link.",
              created_at: "2025-01-15T08:10:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_004",
          ticket_num: "#TS-2025-00126",
          title: "Can't submit request form",
          reporter_user_id: "user_004",
          reporter_email: "testuser@sample.com",
          assigned_user_id: "admin_004",
          assigned_user_name: "Donatello",
          affected_module_id: "mod_005",
          affected_module_name: "Service Request Form",
          issue_type_id: "issue_004",
          issue_type_name: "Form Submission Error",
          severity_id: 2,
          severity_name: "Medium",
          derived_severity_score: 70,
          status: "Resolved",
          priority: "Medium Priority",
          description: "The service request form is not submitting. I click the button, but nothing happens.",
          submitted_at: "2025-01-15T02:00:00Z",
          updated_at: "2025-01-15T02:10:00Z",
          resolved_at: "2025-01-15T02:20:00Z",
          notes: [
            {
              note_id: "note_004",
              incident_id: "inc_004",
              author_user_id: "admin_004",
              author_name: "Donatello",
              author_email: "donatello@toothsync.com",
              body: "Issue resolved. There was a temporary server-side error. Form submissions are now working.",
              created_at: "2025-01-15T02:20:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_005",
          ticket_num: "#TS-2025-00127",
          title: "Database connection issue",
          reporter_user_id: "user_005",
          reporter_email: "admin@sample.com",
          assigned_user_id: "admin_005",
          assigned_user_name: "Mona Lisa",
          affected_module_id: "mod_006",
          affected_module_name: "Others",
          issue_type_id: "issue_005",
          issue_type_name: "Unexpected Error Message",
          severity_id: 3,
          severity_name: "High",
          derived_severity_score: 90,
          status: "Pending",
          priority: "High Priority",
          description: "Getting 'Database connection failed' error when trying to access reports.",
          submitted_at: "2025-01-15T11:00:00Z",
          updated_at: "2025-01-15T11:10:00Z",
          resolved_at: undefined,
          notes: [
            {
              note_id: "note_005",
              incident_id: "inc_005",
              author_user_id: "admin_005",
              author_name: "Mona Lisa",
              author_email: "mona@toothsync.com",
              body: "Escalated to engineering team. Investigating server logs.",
              created_at: "2025-01-15T11:10:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_006",
          ticket_num: "#TS-2025-00128",
          title: "Missing report data",
          reporter_user_id: "user_006",
          reporter_email: "manager@sample.com",
          assigned_user_id: "admin_006",
          assigned_user_name: "Leonardo Da Vinci",
          affected_module_id: "mod_007",
          affected_module_name: "Dashboard/UI",
          issue_type_id: "issue_006",
          issue_type_name: "Missing Logs or Data",
          severity_id: 2,
          severity_name: "Medium",
          derived_severity_score: 75,
          status: "In Progress",
          priority: "Medium Priority",
          description: "Some entries are missing from the daily activity report for May 10th.",
          submitted_at: "2025-01-15T03:15:00Z",
          updated_at: "2025-01-15T03:25:00Z",
          resolved_at: undefined,
          notes: [
            {
              note_id: "note_006",
              incident_id: "inc_006",
              author_user_id: "admin_006",
              author_name: "Leonardo Da Vinci",
              author_email: "leo@toothsync.com",
              body: "Running data integrity check. Will update once complete.",
              created_at: "2025-01-15T03:25:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
        {
          incident_id: "inc_007",
          ticket_num: "#TS-2025-00129",
          title: "User profile not updating",
          reporter_user_id: "user_007",
          reporter_email: "userprofile@sample.com",
          assigned_user_id: "admin_007",
          assigned_user_name: "Raphael Sanzio",
          affected_module_id: "mod_008",
          affected_module_name: "Login & Authentication",
          issue_type_id: "issue_007",
          issue_type_name: "Account Locked",
          severity_id: 1,
          severity_name: "Low",
          derived_severity_score: 50,
          status: "Resolved",
          priority: "Low Priority",
          description: "My profile information (phone number) is not saving after I update it.",
          submitted_at: "2025-01-15T10:00:00Z",
          updated_at: "2025-01-15T10:10:00Z",
          resolved_at: "2025-01-15T10:20:00Z",
          notes: [
            {
              note_id: "note_007",
              incident_id: "inc_007",
              author_user_id: "admin_007",
              author_name: "Raphael Sanzio",
              author_email: "raphael@toothsync.com",
              body: "Fixed a bug in the profile update API. Changes should now save correctly.",
              created_at: "2025-01-15T10:20:00Z",
              visibility: "public",
              is_system: false,
            },
          ],
          attachments: [],
        },
      ],
      [],
    ),
  )

  // Filter tickets based on active tab and search term
  const filteredTickets = useMemo(() => {
    let filtered = allTickets

    if (activeTab !== "All Tickets") {
      filtered = filtered.filter((ticket) => ticket.status === activeTab)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticket_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.affected_module_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    return filtered
  }, [allTickets, activeTab, searchTerm])

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage)
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ticketsPerPage
    const endIndex = startIndex + ticketsPerPage
    return filteredTickets.slice(startIndex, endIndex)
  }, [filteredTickets, currentPage, ticketsPerPage])

  const handleNewTicket = () => {
    router.push("/support/new-ticket")
  }

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedTicket(null)
    // 🟢 OPTIONAL: Re-fetch tickets here if you want the list to update after modal closes
    // e.g., fetchTickets();
  }

  const handleCopyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId)
    toast({
      title: "Copied!",
      description: `Ticket ID ${ticketId} copied to clipboard.`,
    })
  }

  const handleTicketUpdated = () => {
    // This function is called from TicketDetailsModal when an update is successful
    // It allows the parent component (MyTicketsPage) to re-fetch or update its state
    // 🟢 REPLACE WITH ACTUAL DATA RE-FETCHING FROM DATABASE
    // For now, we'll simulate a re-fetch by updating the local state
    setAllTickets((prevTickets) =>
      prevTickets.map((ticket) =>
        ticket.incident_id === selectedTicket?.incident_id ? { ...ticket, status: selectedTicket.status } : ticket,
      ),
    )
    // You might want to fetch the updated ticket from the backend here
    // e.g., fetchUpdatedTicket(selectedTicket.incident_id).then(updatedTicket => {
    //   setAllTickets(prev => prev.map(t => t.incident_id === updatedTicket.incident_id ? updatedTicket : t));
    // });
  }

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: Ticket["status"]) => {
    // 🟢 REPLACE WITH YOUR DATABASE UPDATE LOGIC
    console.log(`Updating ticket ${ticketId} to status: ${newStatus}`)
    setUpdatedTicketIdForModal(ticketId) // Set the ID for the modal

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.5 // 50% success rate for dropdown updates
          if (isSuccess) {
            resolve(true)
          } else {
            reject(new Error("Failed to update ticket status from dropdown"))
          }
        }, 500)
      })

      // Example API call (uncomment and modify when ready)
      /*
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT', // Or PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      */

      // Update local state
      setAllTickets((prevTickets) =>
        prevTickets.map((ticket) => (ticket.incident_id === ticketId ? { ...ticket, status: newStatus } : ticket)),
      )

      // Only show success modal (which leads to feedback) if status is Resolved
      if (newStatus === "Resolved") {
        setShowDropdownUpdateSuccessModal(true)
      } else {
        // For Pending or In Progress updates, just show a toast and close any modals
        toast({
          title: "Ticket Updated!",
          description: `Ticket ${ticketId} status changed to ${newStatus}.`,
        })
        handleDropdownUpdateModalClose() // Ensure no modals are left open
      }
    } catch (error) {
      console.error("Error updating ticket status:", error)
      setShowDropdownUpdateFailureModal(true) // Show failure modal
    }
  }

  // Handlers for the dropdown update modals
  const handleDropdownUpdateModalClose = () => {
    setShowDropdownUpdateSuccessModal(false)
    setShowDropdownUpdateFailureModal(false)
    setUpdatedTicketIdForModal(null)
  }

  const handleDropdownUpdateModalBackToTickets = () => {
    handleDropdownUpdateModalClose()
    // If already on my-tickets page, no navigation needed, just close modal
    // router.push("/support/my-tickets");
  }

  const handleDropdownUpdateModalSubmitFeedback = () => {
    // Close the dropdown update success modal
    setShowDropdownUpdateSuccessModal(false)
    // Open the feedback form modal
    if (updatedTicketIdForModal) {
      setFeedbackTicketId(updatedTicketIdForModal)
      setShowFeedbackFormModal(true)
    }
  }

  const handleDropdownUpdateModalRetry = () => {
    setShowDropdownUpdateFailureModal(false)
    // User can retry from the dropdown menu directly
  }

  // Handler for opening feedback form from TicketDetailsModal
  const handleOpenFeedbackFormFromDetails = (ticketId: string) => {
    // Close TicketDetailsModal first
    setShowDetailsModal(false)
    setSelectedTicket(null)
    // Then open FeedbackFormModal
    setFeedbackTicketId(ticketId)
    setShowFeedbackFormModal(true)
  }

  const handleCloseFeedbackFormModal = () => {
    setShowFeedbackFormModal(false)
    setFeedbackTicketId(undefined)
    // No navigation needed, user stays on my-tickets page
  }

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "In Progress":
        return <History className="w-4 h-4 text-blue-600" />
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      default:
        return null
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-100 font-poppins flex flex-col">
      {/* Header */}
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
          <p className="text-sm text-emerald-100">Dental Clinic Laboratory Support System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200/80 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search tickets by ID or title..."
            className="pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white w-64"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <Button
          onClick={handleNewTicket}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </Button>
      </div>
    </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {["All Tickets", "Pending", "In Progress", "Resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as typeof activeTab)
                  setCurrentPage(1) // Reset to first page on tab change
                }}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-emerald-600 text-emerald-700"
                    : "text-gray-600 hover:text-gray-800"
                } transition-colors duration-200`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-grow" /> {/* Spacer to push filter/sort to right */}
            <div className="flex gap-2">
              <Button variant="outline" className="text-gray-600 hover:bg-gray-50 bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="text-gray-600 hover:bg-gray-50 bg-transparent">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <div
                  key={ticket.incident_id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mr-4">{getStatusIcon(ticket.status)}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">{ticket.affected_module_name}</p>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{ticket.submitted_at.split("T")[0]}</span>
                      <Clock className="w-3 h-3 ml-3 mr-1" />
                      <span>{ticket.submitted_at.split("T")[1]}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex gap-2">
                      <Badge className={`${getStatusBadgeColors(ticket.status)} px-3 py-1 text-xs font-medium`}>
                        {ticket.status}
                      </Badge>
                      <Badge className={`${getPriorityBadgeColors(ticket.priority)} px-3 py-1 text-xs font-medium`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleViewDetails(ticket)} // Open modal on click
                      >
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-50">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyTicketId(ticket.ticket_num)}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Copy Ticket ID</span>
                          </DropdownMenuItem>
                          {ticket.status !== "Resolved" && ( // Only show if not already resolved
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(ticket.incident_id, "Resolved")}>
                              <Check className="mr-2 h-4 w-4 text-emerald-600" />
                              <span>Mark as Resolved</span>
                            </DropdownMenuItem>
                          )}
                          {ticket.status !== "Resolved" && ( // Only show if not already resolved
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(ticket.incident_id, "Pending")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              <span>Cancel Ticket</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No tickets found for this selection.</div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <span>
              Showing {paginatedTickets.length} out of {filteredTickets.length} tickets
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        ticket={selectedTicket}
        onTicketUpdated={handleTicketUpdated} // Pass the callback
        onOpenFeedbackForm={handleOpenFeedbackFormFromDetails} // Pass new callback
      />

      {/* Dropdown Update Success Modal */}
      <TicketUpdateSuccessModal
        isOpen={showDropdownUpdateSuccessModal}
        onClose={handleDropdownUpdateModalClose}
        onSubmitFeedback={handleDropdownUpdateModalSubmitFeedback}
        isResolvedUpdate={true} // This modal is only shown for resolved updates from dropdown
      />

      {/* Dropdown Update Failure Modal */}
      <TicketUpdateFailureModal
        isOpen={showDropdownUpdateFailureModal}
        onClose={handleDropdownUpdateModalClose}
        onRetry={handleDropdownUpdateModalRetry}
        onBackToTickets={handleDropdownUpdateModalBackToTickets}
      />

      {/* Feedback Form Modal (now manages its own success/failure modals) */}
      <FeedbackFormModal
        isOpen={showFeedbackFormModal}
        onClose={handleCloseFeedbackFormModal} // This will now close the form, and the form itself will open the success modal
        ticketId={feedbackTicketId}
      />
    </div>
  )
}
