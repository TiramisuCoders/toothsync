// app/incident-management/new-ticket/NewTicket.tsx
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

export default function NewTicket() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    affectedModule: "",
    category: "",
    description: "",
    reportedBy: "",
    attachments: null as File[] | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [ticketNumber, setTicketNumber] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Fetched data from database
  const [modules, setModules] = useState<Array<{ module_id: string; module_name: string }>>([])
  const [issueTypes, setIssueTypes] = useState<Array<{ issue_type_id: string; issue_type_name: string }>>([])
  const [isLoadingModules, setIsLoadingModules] = useState(true)
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState("")

  const backgroundImages = ["/images/landing-page/school-1.png", "/images/landing-page/school-2.png"]

  // Fetch modules on component mount
  useEffect(() => {
    fetchModules()
  }, [])

  // Fetch issue types when module changes
  useEffect(() => {
    if (selectedModuleId) {
      fetchIssueTypes(selectedModuleId)
    } else {
      setIssueTypes([])
    }
  }, [selectedModuleId])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const fetchModules = async () => {
    try {
      setIsLoadingModules(true)
      console.log('🔄 Fetching modules from:', '/api/support/NewTickets?action=modules')
      
      const response = await fetch('/api/support/NewTickets?action=modules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response not OK:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('📦 Response data:', result)

      if (result.success && result.modules) {
        setModules(result.modules)
        console.log('✅ Fetched modules:', result.modules.length, 'modules')
      } else {
        console.error('❌ Failed to fetch modules:', result.error || 'Unknown error')
        setModules([])
      }
    } catch (error) {
      console.error('💥 Error fetching modules:', error)
      setModules([])
      // Show error to user
      alert('Failed to load modules. Please check console for details.')
    } finally {
      setIsLoadingModules(false)
    }
  }

  const fetchIssueTypes = async (moduleId: string) => {
    try {
      setIsLoadingIssueTypes(true)
      const response = await fetch(`/api/support/NewTickets?action=issue_types&module_id=${moduleId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setIssueTypes(result.issueTypes || [])
        console.log('✅ Fetched issue types:', result.issueTypes)
      } else {
        console.error('Failed to fetch issue types:', result.error)
      }
    } catch (error) {
      console.error('Error fetching issue types:', error)
    } finally {
      setIsLoadingIssueTypes(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "affectedModule" ? { category: "" } : {}),
    }))

    // When module changes, update selectedModuleId to fetch issue types
    if (field === "affectedModule") {
      const module = modules.find(m => m.module_name === value)
      setSelectedModuleId(module?.module_id || "")
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      console.log("📝 Submitting ticket...", formData)

      // Prepare form data for submission
      const submitFormData = new FormData()
      submitFormData.append('title', formData.title)
      submitFormData.append('affectedModule', formData.affectedModule)
      submitFormData.append('category', formData.category)
      submitFormData.append('description', formData.description)
      submitFormData.append('reportedBy', formData.reportedBy)

      // Add files if any
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          submitFormData.append('files', file)
        })
      }

      // Submit ticket with attachments to the unified route
      const response = await fetch('/api/support/NewTickets', {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to submit ticket')
      }

      console.log("✅ Ticket created:", result)

      if (result.attachmentsUploaded > 0) {
        console.log(`✅ Uploaded ${result.attachmentsUploaded} attachment(s)`)
      }

      if (result.attachmentErrors && result.attachmentErrors.length > 0) {
        console.warn("⚠️ Some attachments failed to upload:", result.attachmentErrors)
      }

      // Set success data from API response
      setTicketNumber(result.ticketNumber)
      setSubmissionDate(result.submissionDate)
      setShowSuccessModal(true)

      // Reset form
      setFormData({
        title: "",
        affectedModule: "",
        category: "",
        description: "",
        reportedBy: "",
        attachments: null,
      })
      setSelectedModuleId("")

    } catch (error) {
      console.error("❌ Ticket submission failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit your ticket at this time. Please try again.")
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
    router.push("/incident-management/my-tickets")
  }

  const handleFailureClose = () => {
    setShowFailureModal(false)
  }

  const handleRetry = () => {
    setShowFailureModal(false)
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
              src={image || "/placeholder.svg"}
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
            {/* Ticket Title */}
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

            {/* Affected Module */}
            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                2. Affected Module <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.affectedModule}
                onValueChange={(value) => handleInputChange("affectedModule", value)}
                disabled={isLoadingModules}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingModules ? "Loading modules..." : "Select Module"} />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.module_id} value={module.module_name}>
                      {module.module_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                3. Category / Issue Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={!formData.affectedModule || isLoadingIssueTypes}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    isLoadingIssueTypes ? "Loading categories..." : 
                    formData.affectedModule ? "Select Category" : 
                    "Select a Module First"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((issueType) => (
                    <SelectItem key={issueType.issue_type_id} value={issueType.issue_type_name}>
                      {issueType.issue_type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
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

            {/* Reported by */}
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

            {/* Attachments */}
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

            {/* Submit Button */}
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
        errorMessage={errorMessage || "Unable to submit your ticket at this time. Please try again."}
      />
    </div>
  )
}
