"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
// If your toast hook is actually named 'useToast' and located at '@/components/ui/useToast', update the import:
import { toast } from "sonner"
// If you do not have a toast utility, you need to create one or use a third-party library such as 'react-hot-toast' or 'sonner'.
import { Toaster } from "@/components/ui/toaster"

// Available dental procedures
const procedures = [
  "Tooth Extraction",
  "Dental Cleaning",
  "Dental Filling",
  "Root Canal",
  "Dental Implant",
  "Dental Crown",
  "Dental Bridge",
  "Dental Veneer",
  "Teeth Whitening",
  "Dental X-Ray",
]

export default function ClinicianForm() {
  const [formData, setFormData] = useState({
    firstName: "Maria",
    lastName: "Santos",
    yearLevel: "5th Year",
    section: "A",
    patientName: "",
    selectedProcedures: [] as string[],
    chair: "Auto-assigned",
    instructor: "Auto-assigned",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Handle patient name input
  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, patientName: e.target.value }))
    if (errors.patientName) {
      setErrors((prev) => ({ ...prev, patientName: "" }))
    }
  }

  // Handle procedure selection
  const handleProcedureChange = (procedure: string, checked: boolean) => {
    setFormData((prev) => {
      let newProcedures = [...prev.selectedProcedures]

      if (checked) {
        if (newProcedures.length >= 2) {
          return prev // Don't add if already at max
        }
        newProcedures.push(procedure)
      } else {
        newProcedures = newProcedures.filter((p) => p !== procedure)
      }

      return { ...prev, selectedProcedures: newProcedures }
    })

    if (errors.procedures) {
      setErrors((prev) => ({ ...prev, procedures: "" }))
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required"
    }

    if (formData.selectedProcedures.length === 0) {
      newErrors.procedures = "Please select at least one procedure"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Simulate submission progress
  const simulateSubmission = async () => {
    setSubmitProgress(0)
    const steps = [25, 50, 75, 100]

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSubmitProgress(step)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await simulateSubmission()

      toast(
        <div>
          <span className="font-semibold">Attendance Submitted</span>
          <div className="text-sm text-gray-700">Your attendance has been submitted and is pending approval.</div>
        </div>
      )

      // Show confirmation message
      setShowConfirmation(true)

      // Reset form
      setFormData((prev) => ({
        ...prev,
        patientName: "",
        selectedProcedures: [],
      }))
      setSubmitProgress(0)

      // Hide confirmation after 5 seconds
      setTimeout(() => {
        setShowConfirmation(false)
      }, 5000)
    } catch (error) {
      toast(
        <div className="text-red-700">
          <span className="font-semibold">Submission Failed</span>
          <div className="text-sm">Please try again later.</div>
        </div>
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-semibold text-[#5C8E77]">Submit Attendance</CardTitle>
          <CardDescription className="text-gray-600">
            Fill out this form to initiate the attendance process. Chair and instructor will be auto-assigned.
          </CardDescription>
        </CardHeader>

        {/* Confirmation Message */}
        {showConfirmation && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Attendance Submitted Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your attendance has been submitted and is pending approval. Chair and instructor have been
                  auto-assigned.
                </p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-medium text-gray-700">
                  First Name
                </Label>
                <Input id="firstName" value={formData.firstName} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-medium text-gray-700">
                  Last Name
                </Label>
                <Input id="lastName" value={formData.lastName} disabled className="bg-gray-50 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearLevel" className="font-medium text-gray-700">
                  Year Level
                </Label>
                <select
                  id="yearLevel"
                  value={formData.yearLevel}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                >
                  <option value="5th Year">5th Year</option>
                  <option value="6th Year">6th Year</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="font-medium text-gray-700">
                  Section
                </Label>
                <select
                  id="section"
                  value={formData.section}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>

            {/* Patient Name */}
            <div className="space-y-2">
              <Label htmlFor="patientName" className="font-medium text-gray-700">
                Patient Name
              </Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={handlePatientNameChange}
                placeholder="Enter patient name"
                className={`${errors.patientName ? "border-red-500" : "focus:border-[#5C8E77]"} focus:ring-[#5C8E77]`}
              />
              {errors.patientName && <p className="text-sm text-red-500">{errors.patientName}</p>}
            </div>

            {/* Procedures */}
            <div className="space-y-3">
              <Label className="font-medium text-gray-700">Procedures (Select up to 2)</Label>
              <div className="grid grid-cols-2 gap-3 border border-gray-200 rounded-md p-4">
                {procedures.map((procedure) => (
                  <div key={procedure} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`procedure-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                      checked={formData.selectedProcedures.includes(procedure)}
                      onChange={(e) => handleProcedureChange(procedure, e.target.checked)}
                      className="h-4 w-4 text-[#5C8E77] border-gray-300 rounded focus:ring-[#5C8E77]"
                    />
                    <label
                      htmlFor={`procedure-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {procedure}
                    </label>
                  </div>
                ))}
              </div>

              {formData.selectedProcedures.length === 0 && (
                <p className="text-sm text-red-500">Please select at least one procedure.</p>
              )}
              <p className="text-sm text-gray-500">You can select up to 2 procedures per activity.</p>
            </div>

            {/* Chair and Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="chair" className="font-medium text-gray-700">
                  Requested Chair
                </Label>
                <Input id="chair" value={formData.chair} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-sm text-gray-500">Auto-assigned based on procedure</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor" className="font-medium text-gray-700">
                  Instructor
                </Label>
                <Input id="instructor" value={formData.instructor} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-sm text-gray-500">Auto-assigned based on expertise</p>
              </div>
            </div>

            {/* Progress Bar */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processing submission...</span>
                  <span>{submitProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#5C8E77] h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${submitProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#5C8E77] hover:bg-[#4a7c65] text-white font-medium py-3"
            >
              {isSubmitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}
