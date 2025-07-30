"use client"

import { Heart, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface FeedbackSuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackSuccessModal({ isOpen, onClose }: FeedbackSuccessModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleBackToTickets = () => {
    onClose() // Close the modal
    router.push("/support/my-tickets") // Navigate to my tickets page
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Hand className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-emerald-600">
              <Heart className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Thank you for your feedback!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We've received your response. Your input helps us improve our support experience.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <Button
            onClick={handleBackToTickets}
            variant="outline"
            className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-base font-medium bg-transparent"
          >
            Back to my Tickets
          </Button>
        </div>
      </div>
    </div>
  )
}
