// components/modals/feedback-form-modal.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FeedbackSuccessModal } from "./feedback-success-modal"
import { FeedbackFailureModal } from "./feedback-failure-modal"

interface FeedbackFormModalProps {
  isOpen: boolean
  onClose: () => void 
  ticketId?: string 
}

type Rating = "Poor" | "Very Poor" | "Fair" | "Good" | "Excellent" | ""
type IssueResolved = "Yes" | "No" | "Partially" | ""

const mapIssueResolutionToSupabase = (frontendValue: IssueResolved): string => {
  switch (frontendValue) {
    case "Yes":
      return "Resolved completely"
    case "Partially":
      return "Resolved partially"
    case "No":
      return "Not resolved"
    default:
      return "" 
  }
}

export function FeedbackFormModal({ isOpen, onClose, ticketId }: FeedbackFormModalProps) {
  const { toast } = useToast()
  const [overallExperience, setOverallExperience] = useState<Rating>("")
  const [issueResolved, setIssueResolved] = useState<IssueResolved>("")
  const [supportResponsiveness, setSupportResponsiveness] = useState<Rating>("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackSuccessModal, setShowFeedbackSuccessModal] = useState(false)
  const [showFeedbackFailureModal, setShowFeedbackFailureModal] = useState(false)

  if (!isOpen && !showFeedbackSuccessModal && !showFeedbackFailureModal) return null

  const ratings: Rating[] = ["Poor", "Very Poor", "Fair", "Good", "Excellent"]
  const issueResolvedOptions: IssueResolved[] = ["Yes", "No", "Partially"]

  const isFormValid = () => {
    return (
      overallExperience !== "" &&
      issueResolved !== "" &&
      supportResponsiveness !== "" &&
      additionalComments.trim() !== "" &&
      !!ticketId 
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

    const feedbackPayload = {
      incident_id: ticketId,
      overall_experience: overallExperience,
      issue_resolved: mapIssueResolutionToSupabase(issueResolved), 
      support_responsiveness: supportResponsiveness,
      additional_comments: additionalComments.trim(),
    }

    try {
      console.log('📝 Submitting feedback:', feedbackPayload);
      
      // Submit Feedback
  const feedbackResponse = await fetch('/api/feedback-form', {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackPayload),
      });

      // Check if response is actually JSON
      const contentType = feedbackResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await feedbackResponse.text();
        console.error('❌ Non-JSON response:', textResponse.substring(0, 500));
        throw new Error('Server returned an invalid response. Check the Network tab for details.');
      }

      const result = await feedbackResponse.json();
      
      if (!feedbackResponse.ok) {
        console.error('❌ API Error:', result);
        throw new Error(result.error || result.details || 'Failed to submit feedback.');
      }

      console.log('✅ Feedback submitted successfully:', result);

      // Success
      handleClearForm() 
      onClose()
      setShowFeedbackSuccessModal(true)
      
    } catch (error) {
      console.error("❌ Error submitting feedback:", error)
      
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
      
      // Keep form filled so user can retry
      setShowFeedbackFailureModal(true)
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseFeedbackSuccessModal = () => {
    setShowFeedbackSuccessModal(false)
  }

  const handleCloseFeedbackFailureModal = () => {
    setShowFeedbackFailureModal(false)
  }

  const handleRetryFeedbackSubmission = () => {
    setShowFeedbackFailureModal(false)
    onClose() 
  }

  return (
    <>
      {isOpen && ( 
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> 
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">ToothSync Feedback Form</h2>
                <p className="text-sm text-emerald-100">We'd love your feedback!</p>
              </div>
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