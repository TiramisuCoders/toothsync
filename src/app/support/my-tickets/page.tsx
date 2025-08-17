"use client"

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
import Link from "next/link"
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

// Define the Ticket interface - UPDATED
interface Ticket {
  id: string
  title: string
  module: string
  status: "Pending" | "In Progress" | "Resolved"
  priority: "Low Priority" | "Medium Priority" | "High Priority"
  date: string // e.g., "5/10/2025"
  time: string // e.g., "09:35 AM"
  description: string
  reportedBy: string // email
  attachments?: string[] // Array of attachment filenames/URLs
  adminInCharge?: string
  adminNotes?: string
  category: string // Added category for modal
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
          id: "#TS-2025-00123",
          title: "Wala po akong Instructor",
          module: "Instructor Management",
          category: "Instructor Not Assigned",
          description:
            "Wala pong instructor na na-assign kahit na nakapagsubmit po ako ng form. I have to perform an operation today. Need instructor ASAP.",
          status: "Pending",
          priority: "Medium Priority",
          date: "2025-05-10",
          time: "09:35 AM",
          reportedBy: "johndoe@sample.com",
          attachments: ["/placeholder.svg?height=24&width=24"], // Placeholder for attachment
          adminInCharge: "Mona Lisa",
          adminNotes: "Please refresh the website and log-in again.",
        },
        {
          id: "#TS-2025-00124",
          title: "Mali po 'yung nakadisplay na name ko",
          module: "Dashboard/UI",
          category: "Data Not Loading",
          description: "My name is displayed incorrectly on the dashboard. It shows 'John Doe' instead of 'Jane Doe'.",
          status: "In Progress",
          priority: "Medium Priority",
          date: "2025-05-06",
          time: "04:50 PM",
          reportedBy: "janedoe@sample.com",
          attachments: [],
          adminInCharge: "Leonardo Da Vinci",
          adminNotes: "Checked database, name is correct. Investigating UI rendering issue.",
        },
        {
          id: "#TS-2025-00125",
          title: "Wrong Credentials entered",
          module: "Login & Authentication",
          category: "Unable to Log In",
          description:
            "I am unable to log in using my correct credentials. It keeps saying 'invalid username or password'.",
          status: "In Progress",
          priority: "High Priority",
          date: "2025-05-06",
          time: "08:01 PM",
          reportedBy: "user123@sample.com",
          attachments: [],
          adminInCharge: "Raphael Sanzio",
          adminNotes: "Account locked due to multiple failed attempts. Unlocked account and sent password reset link.",
        },
        {
          id: "#TS-2025-00126",
          title: "Can't submit request form",
          module: "Service Request Form",
          category: "Form Submission Error",
          description: "The service request form is not submitting. I click the button, but nothing happens.",
          status: "Resolved",
          priority: "Medium Priority",
          date: "2025-05-01",
          time: "02:00 PM",
          reportedBy: "testuser@sample.com",
          attachments: [],
          adminInCharge: "Donatello",
          adminNotes: "Issue resolved. There was a temporary server-side error. Form submissions are now working.",
        },
        {
          id: "#TS-2025-00127",
          title: "Database connection issue",
          module: "Others",
          category: "Unexpected Error Message",
          description: "Getting 'Database connection failed' error when trying to access reports.",
          status: "Pending",
          priority: "High Priority",
          date: "2025-05-12",
          time: "11:00 AM",
          reportedBy: "admin@sample.com",
          attachments: [],
          adminInCharge: "Mona Lisa",
          adminNotes: "Escalated to engineering team. Investigating server logs.",
        },
        {
          id: "#TS-2025-00128",
          title: "Missing report data",
          module: "Dashboard/UI",
          category: "Missing Logs or Data",
          description: "Some entries are missing from the daily activity report for May 10th.",
          status: "In Progress",
          priority: "Medium Priority",
          date: "2025-05-11",
          time: "03:15 PM",
          reportedBy: "manager@sample.com",
          attachments: [],
          adminInCharge: "Leonardo Da Vinci",
          adminNotes: "Running data integrity check. Will update once complete.",
        },
        {
          id: "#TS-2025-00129",
          title: "User profile not updating",
          module: "Login & Authentication",
          category: "Account Locked",
          description: "My profile information (phone number) is not saving after I update it.",
          status: "Resolved",
          priority: "Low Priority",
          date: "2025-05-09",
          time: "10:00 AM",
          reportedBy: "userprofile@sample.com",
          attachments: [],
          adminInCharge: "Raphael Sanzio",
          adminNotes: "Fixed a bug in the profile update API. Changes should now save correctly.",
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
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.module.toLowerCase().includes(searchTerm.toLowerCase()),
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
        ticket.id === selectedTicket?.id ? { ...ticket, status: selectedTicket.status } : ticket,
      ),
    )
    // You might want to fetch the updated ticket from the backend here
    // e.g., fetchUpdatedTicket(selectedTicket.id).then(updatedTicket => {
    //   setAllTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
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
        prevTickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket)),
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
            <Link href="/landing" passHref>
              <Image
                src="/images/DOMC-logo.png"
                alt="App Logo"
                width={75}
                height={75}
                className="object-contain cursor-pointer"
              />
            </Link>
          <div>
            <h1 className="text-xl font-bold">Ticket Tracker</h1>
            <p className="text-sm text-emerald-100">Dental Clinic Laboratory Support System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search tickets by ID or title..."
              className="pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page on search
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
                  key={ticket.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mr-4">{getStatusIcon(ticket.status)}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">{ticket.module}</p>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{ticket.date}</span>
                      <Clock className="w-3 h-3 ml-3 mr-1" />
                      <span>{ticket.time}</span>
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
                          <DropdownMenuItem onClick={() => handleCopyTicketId(ticket.id)}>
                            <span>Copy Ticket ID</span>
                          </DropdownMenuItem>
                          {ticket.status !== "Resolved" && ( // Only show if not already resolved
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(ticket.id, "Resolved")}>
                              <span>Mark as Resolved</span>
                            </DropdownMenuItem>
                          )}
                          {ticket.status !== "Resolved" && ( // Only show if not already resolved
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(ticket.id, "Pending")}>
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
