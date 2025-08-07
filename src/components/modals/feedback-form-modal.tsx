"use client"

import type React from "react"

import { useState } from "react"
// Removed X icon import as the button is being removed
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast" // Assuming you have a useToast hook
import { FeedbackSuccessModal } from "./feedback-success-modal" // Import the new success modal
import { FeedbackFailureModal } from "./feedback-failure-modal" // Import the new failure modal

interface FeedbackFormModalProps {
  isOpen: boolean
  onClose: () => void // This onClose will now close the form and potentially open the success modal
  ticketId?: string // Optional: to link feedback to a specific ticket
}

type Rating = "Poor" | "Very Poor" | "Fair" | "Good" | "Excellent" | ""
type IssueResolved = "Yes" | "No" | "Partially" | ""

export function FeedbackFormModal({ isOpen, onClose, ticketId }: FeedbackFormModalProps) {
  const { toast } = useToast()
  const [overallExperience, setOverallExperience] = useState<Rating>("")
  const [issueResolved, setIssueResolved] = useState<IssueResolved>("")
  const [supportResponsiveness, setSupportResponsiveness] = useState<Rating>("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackSuccessModal, setShowFeedbackSuccessModal] = useState(false) // New state for success modal
  const [showFeedbackFailureModal, setShowFeedbackFailureModal] = useState(false) // New state for failure modal

  // Only render if any of the modals are open
  if (!isOpen && !showFeedbackSuccessModal && !showFeedbackFailureModal) return null

  const ratings: Rating[] = ["Poor", "Very Poor", "Fair", "Good", "Excellent"]
  const issueResolvedOptions: IssueResolved[] = ["Yes", "No", "Partially"]

  const isFormValid = () => {
    return (
      overallExperience !== "" &&
      issueResolved !== "" &&
      supportResponsiveness !== "" &&
      additionalComments.trim() !== ""
    )
  }

  const handleClearForm = () => {
    setOverallExperience("")
    setIssueResolved("")
    setSupportResponsiveness("")
    setAdditionalComments("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all mandatory fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("Submitting feedback for ticket:", ticketId)
    console.log({
      overallExperience,
      issueResolved,
      supportResponsiveness,
      additionalComments,
    })

    // 🟢 REPLACE WITH YOUR DATABASE SUBMISSION LOGIC
    try {
      // Simulate API call with random success/failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.3 // 70% success rate for demo
          if (isSuccess) {
            resolve(true)
          } else {
            reject(new Error("Network error or server issue."))
          }
        }, 1500)
      })

      // Example API call (uncomment and modify when ready)
      /*
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          overallExperience,
          issueResolved,
          supportResponsiveness,
          additionalComments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted successfully:', result);
      */

      // On success, close the form and open the success modal
      onClose() // Close the feedback form itself
      setShowFeedbackSuccessModal(true) // Open the new success modal
      handleClearForm() // Clear form after successful submission
    } catch (error) {
      console.error("Error submitting feedback:", error)
      onClose() // Close the feedback form itself
      setShowFeedbackFailureModal(true) // Open the new failure modal
      // No need for toast here, as the modal will show the message
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseFeedbackSuccessModal = () => {
    setShowFeedbackSuccessModal(false)
    // The parent's onClose (from MyTicketsPage) will handle closing the backdrop
    // and ensuring only the ticket tracker is visible.
  }

  const handleCloseFeedbackFailureModal = () => {
    setShowFeedbackFailureModal(false)
    // The parent's onClose (from MyTicketsPage) will handle closing the backdrop
    // and ensuring only the ticket tracker is visible.
  }

  const handleRetryFeedbackSubmission = () => {
    setShowFeedbackFailureModal(false)
    // Re-open the feedback form for the user to try again
    // The parent component (MyTicketsPage) needs to be informed to re-open the form
    // For simplicity here, we'll just close the failure modal and expect the user to re-trigger the form.
    // A more robust solution might involve passing a callback to re-open the form.
    // For now, we'll just close the failure modal and the user can click "Submit Feedback" again.
  }

  return (
    <>
      {isOpen && ( // Only render the form if isOpen is true
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">ToothSync Feedback Form</h2>
                <p className="text-sm text-emerald-100">We'd love your feedback!</p>
              </div>
              {/* Removed the close button (X) to make the form mandatory */}
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                Thank you for using ToothSync. Your feedback helps us improve our services and support. Please take a
                moment to share your thoughts below.
              </p>

              {/* 1. Overall Experience */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Overall Experience <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  onValueChange={(value: Rating) => setOverallExperience(value)}
                  value={overallExperience}
                  className="flex flex-wrap gap-4 justify-between"
                >
                  {ratings.map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating} id={`overall-${rating.toLowerCase().replace(" ", "-")}`} />
                      <Label htmlFor={`overall-${rating.toLowerCase().replace(" ", "-")}`}>{rating}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 2. Issue Resolution */}
              <div>
                <Label htmlFor="issue-resolution" className="block text-sm font-medium text-gray-700 mb-2">
                  2. Issue Resolution <span className="text-red-500">*</span>
                </Label>
                <Select value={issueResolved} onValueChange={(value: IssueResolved) => setIssueResolved(value)}>
                  <SelectTrigger id="issue-resolution" className="w-full">
                    <SelectValue placeholder="Was your issue resolved?" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueResolvedOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Support Responsiveness */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Support Responsiveness <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  onValueChange={(value: Rating) => setSupportResponsiveness(value)}
                  value={supportResponsiveness}
                  className="flex flex-wrap gap-4 justify-between"
                >
                  {ratings.map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating} id={`support-${rating.toLowerCase().replace(" ", "-")}`} />
                      <Label htmlFor={`support-${rating.toLowerCase().replace(" ", "-")}`}>{rating}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 4. Additional Comments */}
              <div>
                <Label htmlFor="additional-comments" className="block text-sm font-medium text-gray-700 mb-2">
                  4. Additional Comments <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="additional-comments"
                  placeholder="Any suggestions, comments, or areas we can improve?"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  className="w-full min-h-[100px] resize-y"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium"
                >
                  {isSubmitting ? "Submitting Feedback..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  onClick={handleClearForm}
                  variant="outline"
                  className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-lg font-medium bg-transparent"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Success Modal */}
      <FeedbackSuccessModal isOpen={showFeedbackSuccessModal} onClose={handleCloseFeedbackSuccessModal} />

      {/* Feedback Failure Modal */}
      <FeedbackFailureModal
        isOpen={showFeedbackFailureModal}
        onClose={handleCloseFeedbackFailureModal}
        onRetry={handleRetryFeedbackSubmission}
      />
    </>
  )
}
