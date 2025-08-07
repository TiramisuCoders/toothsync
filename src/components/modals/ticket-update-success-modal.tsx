"use client"

import { Check, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation" // Import useRouter

interface TicketUpdateSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitFeedback: () => void // Changed to directly open feedback
  isResolvedUpdate: boolean // New prop to determine if it was a resolved update
}

export function TicketUpdateSuccessModal({
  isOpen,
  onClose,
  onSubmitFeedback,
  isResolvedUpdate,
}: TicketUpdateSuccessModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleBackToTickets = () => {
    onClose() // Close the modal
    router.push("/support/my-tickets") // Navigate to my tickets page
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Tag className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-emerald-600">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket Update Submitted!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your update has been successfully sent. Our admin team will review it and get back to you shortly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isResolvedUpdate ? (
            <Button
              onClick={onSubmitFeedback}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base font-medium"
            >
              Submit Feedback form
            </Button>
          ) : (
            <Button
              onClick={handleBackToTickets}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base font-medium"
            >
              Back to my Tickets
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-base font-medium bg-transparent"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
