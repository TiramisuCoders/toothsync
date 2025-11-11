// app/support/faq/new-ticket/SubmitTicketForm.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Paperclip, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketSuccessModal } from "@/components/modals/support-faq/ticket-success-modal" 
import { TicketFailureModal } from "@/components/modals/support-faq/ticket-failure-modal"   
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

// API paths use the root-level path structure for Next.js API routes
const API_GET_URL_BASE = '/api/support/SubmitTicketForm'; 
const API_POST_URL = '/api/support/SubmitTicketForm'; 

const INITIAL_FORM_DATA = {
    title: "",
    affectedModule: "",
    category: "",
    description: "",
    reportedBy: "", // Will be populated from actual user
    attachments: null as File[] | null,
};

const SUPPORT_TEAM_EMAIL = "judeemmanuel.flores.cics@ust.edu.ph";

export default function SubmitTicketForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [ticketNumber, setTicketNumber] = useState("")
  const [submissionDate, setSubmissionDate] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [modules, setModules] = useState<Array<{ module_id: string; module_name: string }>>([])
  const [issueTypes, setIssueTypes] = useState<Array<{ issue_type_id: string; issue_type_name: string }>>([])
  const [isLoadingModules, setIsLoadingModules] = useState(true)
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState("")
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isChiefOfClinicians, setIsChiefOfClinicians] = useState(false)

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- Fetch Current User and Role ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoadingUser(true)
        
        // Get user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          toast({ 
            title: "Authentication Error", 
            description: "Could not fetch user information. Please log in again.", 
            variant: "destructive" 
          })
          return
        }

        if (user?.email) {
          console.log('✅ Logged in user:', user.email)
          setFormData(prev => ({
            ...prev,
            reportedBy: user.email || ""
          }))
        } else {
          console.warn('⚠️ No user email found')
          toast({ 
            title: "Warning", 
            description: "User email not found. Please ensure you are logged in.", 
            variant: "destructive" 
          })
        }

        // Check if user is Chief of Clinicians (R04)
        const roleCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('role='))
          ?.split('=')[1];
        
        console.log('🔍 [DEBUG] Role Cookie Value:', roleCookie);
        console.log('🔍 [DEBUG] Is Chief?:', roleCookie === 'chief-of-clinicians');
        
        if (roleCookie === 'chief-of-clinicians') {
          console.log('👑 User is Chief of Clinicians (R04)')
          setIsChiefOfClinicians(true)
        }

      } catch (error) {
        console.error('Error in fetchCurrentUser:', error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchCurrentUser()
  }, [])

  // --- Load prefilled data from sessionStorage (for Activity Log warnings) ---
  useEffect(() => {
    const prefillData = sessionStorage.getItem('ticketPrefill')
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData)
        
        // Set the form data with prefilled values
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          affectedModule: data.affectedModule || prev.affectedModule,
          category: data.category || prev.category,
        }))
        
        // If affectedModule is set, find and set the module ID
        if (data.affectedModule && modules.length > 0) {
          const module = modules.find(m => m.module_name === data.affectedModule)
          if (module) {
            setSelectedModuleId(module.module_id)
          }
        }
        
        // Clear the sessionStorage after loading
        sessionStorage.removeItem('ticketPrefill')
        
        // Show success message
        toast({
          title: "Form Pre-filled",
          description: "Activity log warning data has been loaded into the form.",
        })
      } catch (error) {
        console.error('Error loading prefill data:', error)
      }
    }
  }, [modules]) // Depends on modules to ensure they're loaded first

  // --- Data Fetching ---

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    if (selectedModuleId) {
      fetchIssueTypes(selectedModuleId)
    } else {
      setIssueTypes([])
    }
  }, [selectedModuleId])

  const fetchModules = async () => {
    try {
      setIsLoadingModules(true)
      const response = await fetch(`${API_GET_URL_BASE}?action=modules`, { cache: 'no-store' }) 
      const result = await response.json()
      if (result.success && result.modules) {
        setModules(result.modules)
      } else {
        setModules([])
      }
    } catch (error) {
      setModules([])
      toast({ title: "Error", description: "Failed to load modules.", variant: "destructive" })
    } finally {
      setIsLoadingModules(false)
    }
  }

  const fetchIssueTypes = async (moduleId: string) => {
    try {
      setIsLoadingIssueTypes(true)
      const response = await fetch(`${API_GET_URL_BASE}?action=issue_types&module_id=${moduleId}`) 
      const result = await response.json()

      if (response.ok && result.success) {
        setIssueTypes(result.issueTypes || [])
      }
    } catch (error) {
      console.error('Error fetching issue types:', error)
    } finally {
      setIsLoadingIssueTypes(false)
    }
  }
  
  // --- Form Logic ---

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "affectedModule" ? { category: "" } : {}),
    }))

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
      const submitFormData = new FormData()
      submitFormData.append('title', formData.title)
      submitFormData.append('affectedModule', formData.affectedModule)
      submitFormData.append('category', formData.category)
      submitFormData.append('description', formData.description)
      submitFormData.append('reportedBy', formData.reportedBy)
      
      // Flag for R04 users
      console.log('🔍 [DEBUG] isChiefOfClinicians state:', isChiefOfClinicians);
      if (isChiefOfClinicians) {
        console.log('✅ Adding isChiefOfClinicians flag to FormData');
        submitFormData.append('isChiefOfClinicians', 'true')
      }

      // Debug: Log all FormData entries
      console.log('📦 [DEBUG] FormData entries:');
      for (let [key, value] of submitFormData.entries()) {
        console.log(`  ${key}:`, value);
      }

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          submitFormData.append('files', file)
        })
      }

      const response = await fetch(API_POST_URL, {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to submit ticket')
      }

      setTicketNumber(result.ticketNumber)
      setSubmissionDate(result.submissionDate)
      setShowSuccessModal(true)

      setFormData(INITIAL_FORM_DATA)
      setSelectedModuleId("")

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit your ticket at this time. Please try again.")
      setShowFailureModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    router.push("/support/faq/my-ticket") 
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
  
  // --- Rendering ---
  
  return (
    <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Submit Support Ticket</h1>
        {/* Button directs back to the FAQ/Help page */}
        <Button onClick={() => router.push("/support/faq")} variant="ghost" aria-label="Close form">
          <X className="w-5 h-5 text-gray-500" />
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingUser ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user information...</p>
          </div>
        </div>
      ) : (
        <>
          {/* R04 Support Team Notice */}
          {isChiefOfClinicians && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Support Team Assignment</h3>
                <p className="text-sm text-blue-800">
                  As Chief of Clinicians, your tickets will be automatically assigned to our support team at{" "}
                  <span className="font-medium">{SUPPORT_TEAM_EMAIL}</span>
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* 3. Category */}
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

            {/* 5. Reported by (Pre-filled with actual user) */}
            <div>
              <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-2">
                5. Reported by (Email) <span className="text-red-500">*</span>
              </label>
              <Input
                id="reportedBy"
                type="email"
                placeholder="Your email address"
                value={formData.reportedBy}
                onChange={(e) => handleInputChange("reportedBy", e.target.value)}
                className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                required
                readOnly={true}
              />
              {formData.reportedBy && (
                <p className="mt-1 text-xs text-gray-500">
                  This is your registered account email
                </p>
              )}
            </div>

            {/* R04 Assignment Display */}
            {isChiefOfClinicians && (
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned to (Support Team)
                </label>
                <Input
                  id="assignedTo"
                  type="text"
                  value={SUPPORT_TEAM_EMAIL}
                  className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                  readOnly={true}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your ticket will be handled by our support team
                </p>
              </div>
            )}

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
        </>
      )}
      
      {/* Modals */}
      <TicketSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        ticketNumber={ticketNumber}
        submissionDate={submissionDate}
      />

      <TicketFailureModal
        isOpen={showFailureModal}
        onClose={handleFailureClose}
        onRetry={handleRetry}
        errorMessage={errorMessage || "Unable to submit your ticket at this time. Please try again."}
      />
    </div>
  )
}