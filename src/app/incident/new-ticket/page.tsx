"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { X, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketSuccessModal } from "@/components/modals/ticket-success-modal"
import { TicketFailureModal } from "@/components/modals/ticket-failure-modal"

export default function NewTicketPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    affectedModule: "",
    category: "",
    description: "",
    date: "",
    reportedBy: "",
    attachments: null as File[] | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [ticketNumber, setTicketNumber] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")

  const backgroundImages = ["/images/landing-page/school-1.png", "/images/landing-page/school-2.png"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const modules = [
    "Login & Authentication",
    "Instructor Management",
    "Resource Allocation",
    "Service Request Form",
    "Dashboard/UI",
    "Others",
  ]

  const categoryOptions: Record<string, string[]> = {
    "Login & Authentication": [
      "Unable to Log In",
      "Account Locked",
      "Forgotten Password",
      "Role Access Issue",
      "Role Permissions Not Working",
      "Others",
    ],
    "Instructor Management": [
      "Instructor Not Assigned",
      "Missing Grade Entry",
      "Instructor Assigned Outside Schedule",
      "Access or Visibility Issue",
      "Unequal Instructor Load",
      "Others",
    ],
    "Resource Allocation": [
      "Chair Assignment Error",
      "Incorrect Chair Assignment",
      "Resource Not Appearing",
      "Manual Override Failed",
      "Inaccurate Chair Status",
      "Others",
    ],
    "Service Request Form": [
      "Form Submission Error",
      "Cannot Upload Attachment",
      "Admin Not Assigned",
      "Incorrect Form Access",
      "Cannot Update Request",
      "Others",
    ],
    "Dashboard/UI": [
      "Data Not Loading",
      "Missing Logs or Data",
      "Wrong Summary Displayed",
      "Logbook Export Fails",
      "Action Buttons Not Responding",
      "Others",
    ],
    Others: [
      "Ticket Missing",
      "Unexpected Error Message",
      "Attendance Log Not Updating",
      "Data Integrity Issue",
      "Performance Lag",
      "General Inquiry",
    ],
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "affectedModule" ? { category: "" } : {}), // Reset category when module changes
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setFormData((prev) => ({
        ...prev,
        attachments: Array.from(files),
      }))
    }
  }

  // 🔴 REMOVE THIS FUNCTION WHEN CONNECTING TO DATABASE
  // This generates random ticket numbers for demo purposes
  const generateRandomTicketNumber = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
    return `#TS-${year}-${randomNum}`
  }

  // 🟢 REPLACE WITH THIS WHEN CONNECTING TO DATABASE
  // This will generate sequential ticket numbers based on database count
  const generateSequentialTicketNumber = (ticketCount: number) => {
    const year = new Date().getFullYear()
    const sequentialNum = (ticketCount + 1).toString().padStart(5, "0")
    return `#TS-${year}-${sequentialNum}`
  }

  const formatSubmissionDate = () => {
    const now = new Date()
    return (
      now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " | " +
      now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 🔴 REMOVE THIS ENTIRE SIMULATION BLOCK WHEN CONNECTING TO DATABASE
      // ==================== SIMULATION START ====================
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demo
          const isSuccess = Math.random() > 0.3 // 70% success rate
          if (isSuccess) {
            resolve(true)
          } else {
            reject(new Error("Network error occurred"))
          }
        }, 2000)
      })
      // ==================== SIMULATION END ====================

      // 🟢 REPLACE THE SIMULATION ABOVE WITH REAL API CALL:
      /*
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          affectedModule: formData.affectedModule,
          category: formData.category,
          description: formData.description,
          reportedBy: formData.reportedBy,
          // Handle file uploads separately if needed
          // attachments: formData.attachments,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit ticket')
      }

      const result = await response.json()
      // result should contain: { ticketNumber: "#TS-2025-00001", submissionDate: "..." }
      */

      // 🔴 REMOVE THESE LINES WHEN CONNECTING TO DATABASE
      // Success case - currently using random ticket number
      console.log("Support ticket submitted:", formData)
      setTicketNumber(generateRandomTicketNumber()) // 🔴 REMOVE THIS LINE
      setSubmissionDate(formatSubmissionDate())

      // 🟢 REPLACE WITH THESE LINES WHEN CONNECTING TO DATABASE:
      /*
      setTicketNumber(result.ticketNumber) // Get from API response
      setSubmissionDate(result.submissionDate) // Get from API response
      */

      setShowSuccessModal(true)
    } catch (error) {
      // 🟢 KEEP THIS ERROR HANDLING - it will work with real API calls
      console.error("Ticket submission failed:", error)
      setShowFailureModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    router.push("/")
  }

  const handleViewTickets = () => {
    setShowSuccessModal(false)
    router.push("/support/my-tickets")
  }

  const handleFailureClose = () => {
    setShowFailureModal(false)
  }

  const handleRetry = () => {
    setShowFailureModal(false)
    // Form stays filled, user can try submitting again
  }

  const isFormValid = () => {
    return formData.title && formData.affectedModule && formData.category && formData.description && formData.reportedBy
  }

  return (
    <div className="relative min-h-screen overflow-hidden font-poppins m-0 p-0">
      {/* Background Carousel */}
      <div className="fixed inset-0 z-0 -top-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image || "/placeholder.svg?height=1080&width=1920&query=school building background"}
              alt={`Background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-emerald-600/60" />
          </div>
        ))}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-0">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden mt-4">
          {/* Header */}
          <div className="bg-emerald-700 text-white p-6 relative">
            <button
              onClick={() => router.back()}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              aria-label="Close form"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold mb-2">Submit Support Ticket</h1>
            <p className="text-emerald-100">Please provide details about the issue you're experiencing</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 1. Ticket Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                1. Ticket Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Short, descriptive summary"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* 2. Affected Module */}
            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                2. Affected Module <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.affectedModule}
                onValueChange={(value) => handleInputChange("affectedModule", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                3. Category / Issue Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={!formData.affectedModule}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={formData.affectedModule ? "Select Category" : "Select a Module First"} />
                </SelectTrigger>
                <SelectContent>
                  {(categoryOptions[formData.affectedModule] || []).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                4. Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Detailed explanation of the issue"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full min-h-[100px] resize-y"
                required
              />
            </div>

            {/* 5. Reported by */}
            <div>
              <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-2">
                5. Reported by <span className="text-red-500">*</span>
              </label>
              <Input
                id="reportedBy"
                type="email"
                placeholder="Enter your email address"
                value={formData.reportedBy}
                onChange={(e) => handleInputChange("reportedBy", e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* 6. Attachments */}
            <div>
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                6. Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                <input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                />
                <label htmlFor="attachments" className="cursor-pointer">
                  <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="text-emerald-600 font-medium">Add files</span> or upload screenshots, logs, etc.
                  </p>
                </label>
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">{formData.attachments.length} file(s) selected</div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium"
              >
                {isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <TicketSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        onViewTickets={handleViewTickets}
        ticketNumber={ticketNumber}
        submissionDate={submissionDate}
      />

      {/* Failure Modal */}
      <TicketFailureModal
        isOpen={showFailureModal}
        onClose={handleFailureClose}
        onRetry={handleRetry}
        errorMessage="Unable to submit your ticket at this time. Please check your connection and try again."
      />
    </div>
  )
}
