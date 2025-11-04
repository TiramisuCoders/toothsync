"use client"

import { useRouter } from "next/navigation"
import { Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TicketSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  ticketNumber: string
  submissionDate: string
}

export function TicketSuccessModal({
  isOpen,
  onClose,
  ticketNumber,
  submissionDate,
}: TicketSuccessModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null

  const handleViewTickets = () => {
    onClose()
    router.push("/support/faq/my-ticket")
  }

  const handleBackToFAQ = () => {
    onClose()
    router.push("/support/faq")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-emerald-600">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm mb-2">{ticketNumber}</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket Submitted Successfully</h2>
          <p className="text-gray-500 text-sm mb-2">Date Submitted: {submissionDate}</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your ticket has been logged. A support representative will review your issue shortly. You'll receive updates
            via email or in-app notifications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleViewTickets}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-base font-medium"
          >
            View my tickets
          </Button>

          <button
            onClick={handleBackToFAQ}
            className="block w-full text-emerald-600 hover:underline py-2 text-base font-medium"
          >
            Go back to Help/FAQ
          </button>
        </div>
      </div>
    </div>
  )
}