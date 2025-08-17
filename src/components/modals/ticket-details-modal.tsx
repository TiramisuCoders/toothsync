"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, User, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TicketUpdateSuccessModal } from "./ticket-update-success-modal" // Import new success modal
import { TicketUpdateFailureModal } from "./ticket-update-failure-modal" // Import new failure modal
import { useRouter } from "next/navigation" // Import useRouter

// Define the Ticket interface (should match the one in my-tickets/page.tsx)
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

interface TicketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
  onTicketUpdated: () => void // Callback to notify parent of update
  onOpenFeedbackForm: (ticketId: string) => void // New callback to open feedback form
}

export function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  onTicketUpdated,
  onOpenFeedbackForm,
}: TicketDetailsModalProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<Ticket["status"] | "">("")
  const [userNote, setUserNote] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // States for the new update modals
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false)
  const [showUpdateFailureModal, setShowUpdateFailureModal] = useState(false)

  useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status)
      setUserNote("") // Clear note when a new ticket is opened
      setShowUpdateSuccessModal(false) // Ensure update modals are closed
      setShowUpdateFailureModal(false)
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

  const handleUpdateTicket = async () => {
    setIsUpdating(true)
    // 🟢 REPLACE WITH YOUR DATABASE UPDATE LOGIC
    console.log("Updating ticket:", ticket.id)
    console.log("New Status:", currentStatus)
    console.log("User Note:", userNote)

    try {
      // 🔴 REMOVE THIS ENTIRE SIMULATION BLOCK WHEN CONNECTING TO DATABASE
      // ==================== SIMULATION START ====================
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.3 // 70% success rate
          if (isSuccess) {
            resolve(true)
          } else {
            reject(new Error("Failed to update ticket"))
          }
        }, 1500)
      })
      // ==================== SIMULATION END ====================

      // Example API call (uncomment and modify when ready)
      /*
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT', // Or PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: currentStatus,
          userNote: userNote, // You might want to append notes to an array in your DB
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      const result = await response.json();
      console.log('Ticket updated successfully:', result);
      */

      setShowUpdateSuccessModal(true) // Show success modal
      onTicketUpdated() // Notify parent to re-fetch/update list
    } catch (error) {
      console.error("Error updating ticket:", error)
      setShowUpdateFailureModal(true) // Show failure modal
    } finally {
      setIsUpdating(false)
    }
  }

  // Handlers for the new update modals
  const handleUpdateModalClose = () => {
    setShowUpdateSuccessModal(false)
    setShowUpdateFailureModal(false)
    onClose() // Close the details modal as well
  }

  const handleUpdateModalBackToTickets = () => {
    handleUpdateModalClose()
    router.push("/support/my-tickets") // Navigate back to tickets list
  }

  const handleUpdateModalSubmitFeedback = () => {
    // Close all current modals (details, update success/failure)
    setShowUpdateSuccessModal(false)
    setShowUpdateFailureModal(false)
    onClose() // Close the details modal
    // Then open the feedback form modal from the parent
    if (ticket?.id) {
      onOpenFeedbackForm(ticket.id)
    }
  }

  const handleUpdateModalRetry = () => {
    setShowUpdateFailureModal(false)
    // Keep the details modal open for user to retry
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{ticket.title}</h2>
            <p className="text-sm text-emerald-100">{ticket.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close ticket details"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Ticket Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Details</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Affected Module</p>
                <p className="text-base text-gray-800">{ticket.module}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category / Issue Type</p>
                <p className="text-base text-gray-800">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description of the Issue</p>
                <p className="text-base text-gray-800 leading-relaxed">{ticket.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{ticket.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{ticket.time}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reported by</p>
                <div className="flex items-center text-base text-gray-800">
                  <User className="w-4 h-4 mr-2" />
                  <span>{ticket.reportedBy}</span>
                </div>
              </div>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Attachments</p>
                  <div className="flex flex-col gap-2 mt-1">
                    {ticket.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment} // 🟢 REPLACE WITH ACTUAL ATTACHMENT URL
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-emerald-600 hover:underline text-sm"
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        {attachment.split("/").pop()} {/* Display filename */}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Status & Admin Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status & Admin Info</h3>

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
              {ticket.adminInCharge && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin-in-charge</p>
                  <p className="text-base text-gray-800">{ticket.adminInCharge}</p>
                </div>
              )}
              {ticket.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin notes</p>
                  <Textarea
                    value={ticket.adminNotes}
                    readOnly
                    className="w-full min-h-[80px] resize-y bg-gray-50 border-gray-200 text-gray-700"
                  />
                </div>
              )}

              {/* User Update Section */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                <Select value={currentStatus} onValueChange={(value) => setCurrentStatus(value as Ticket["status"])}>
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
                  placeholder="Add a note or update for this ticket"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="w-full min-h-[80px] resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button
            onClick={handleUpdateTicket}
            disabled={isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-base font-medium"
          >
            {isUpdating ? "Updating Ticket..." : "Update Ticket"}
          </Button>
        </div>
      </div>

      {/* Ticket Update Success Modal */}
      <TicketUpdateSuccessModal
        isOpen={showUpdateSuccessModal}
        onClose={handleUpdateModalClose}
        onSubmitFeedback={handleUpdateModalSubmitFeedback}
        isResolvedUpdate={currentStatus === "Resolved"} // Pass the new prop
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
