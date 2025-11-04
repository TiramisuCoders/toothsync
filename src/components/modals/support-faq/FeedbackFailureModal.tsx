"use client"

import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeedbackFailureModalProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  errorMessage?: string
}

export function FeedbackFailureModal({
  isOpen,
  onClose,
  onRetry,
  errorMessage = "An unexpected error occurred while submitting your feedback. Please try again.",
}: FeedbackFailureModalProps) {
  if (!isOpen) return null

  const handleCloseFailure = () => {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-red-600">
              <X className="w-4 h-4 text-red-600 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Feedback Submission Failed</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCloseFailure}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}