"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"

interface Procedure {
  procedure_id: string
  name: string
}

export default function ClinicianForm() {
  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "",
    shift: "",
    patientName: "",
    selectedProcedures: [] as string[],
    chair: "Auto-assigned",
    instructor: "Auto-assigned",
    clinicianUserId: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [procedures, setProcedures] = useState<Procedure[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authenticated user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          console.error("User not authenticated:", userError)
          toast("Authentication Error", { description: "Please log in to continue." })
          return
        }

        // Set user ID
        setFormData((prev) => ({
          ...prev,
          clinicianUserId: userData.user.id,
        }))

        // Fetch user details
        const { data: clinician, error: clinicianError } = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("auth_user_id", userData.user.id)
          .single()

        if (clinicianError) {
          console.error("Failed to fetch clinician data:", clinicianError)
          toast("Error", { description: "Failed to load user data." })
        } else {
          setFormData((prev) => ({
            ...prev,
            firstName: clinician.first_name || "",
            lastName: clinician.last_name || "",
          }))
        }

        // Fetch procedures
        const { data: procedureData, error: procedureError } = await supabase
          .from("procedure")
          .select("procedure_id, name")

        if (procedureError) {
          console.error("Error fetching procedures:", procedureError)
          toast("Error", { description: "Failed to load procedures." })
        } else {
          setProcedures(procedureData || [])
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        toast("Error", { description: "Failed to load form data." })
      }
    }

    fetchData()
  }, [])

  const handleShiftChange = (value: string) => {
    setFormData((prev) => ({ ...prev, shift: value }))
    if (errors.shift) setErrors((prev) => ({ ...prev, shift: "" }))
  }

  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, patientName: e.target.value }))
    if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: "" }))
  }

  const handleProcedureChange = (procedure: string, checked: boolean) => {
    setFormData((prev) => {
      let newProcedures = [...prev.selectedProcedures]

      if (checked) {
        if (newProcedures.length >= 2) {
          toast("Limit Reached", { description: "You can only select up to 2 procedures." })
          return prev
        }
        newProcedures.push(procedure)
      } else {
        newProcedures = newProcedures.filter((p) => p !== procedure)
      }

      return { ...prev, selectedProcedures: newProcedures }
    })

    if (errors.procedures) setErrors((prev) => ({ ...prev, procedures: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.shift) {
      newErrors.shift = "Please select a shift"
    }

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required"
    }

    if (formData.selectedProcedures.length === 0) {
      newErrors.procedures = "Please select at least one procedure"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setSubmitProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 200)
    return interval
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitProgress(0)
    
    const progressInterval = simulateProgress()

    try {
      const response = await fetch('/api/form/clinician', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: formData.patientName,
          selectedProcedures: formData.selectedProcedures,
          shift: formData.shift,
          clinicianUserId: formData.clinicianUserId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit attendance')
      }

      // Complete progress
      clearInterval(progressInterval)
      setSubmitProgress(100)

      // Show success message
      toast("Attendance Submitted", {
        description: "Your attendance has been submitted and is pending approval.",
      })

      setShowConfirmation(true)

      // Reset form
      setFormData((prev) => ({
        ...prev,
        shift: "",
        patientName: "",
        selectedProcedures: [],
      }))

      setTimeout(() => setShowConfirmation(false), 5000)

    } catch (error) {
      clearInterval(progressInterval)
      console.error("Submission error:", error)
      
      toast("Submission Failed", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
      setSubmitProgress(0)
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
                  Your attendance has been submitted and is pending approval. Chair and instructor have been auto-assigned.
                </p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Static Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName} disabled className="bg-gray-50 text-gray-500" />
              </div>
            </div>

            {/* Shift Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={formData.shift} onValueChange={handleShiftChange}>
                <SelectTrigger className={`${errors.shift ? "border-red-500" : "focus:border-[#5C8E77]"}`}>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st</SelectItem>
                  <SelectItem value="2nd">2nd</SelectItem>
                </SelectContent>
              </Select>
              {errors.shift && <p className="text-sm text-red-500">{errors.shift}</p>}
            </div>

            {/* Patient Name */}
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
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
              <Label>Procedures (Select up to 2)</Label>
              <div className="grid grid-cols-2 gap-3 border border-gray-200 rounded-md p-4">
                {procedures.map((procedure) => (
                  <div key={procedure.procedure_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`procedure-${procedure.procedure_id}`}
                      checked={formData.selectedProcedures.includes(procedure.procedure_id)}
                      onChange={(e) => handleProcedureChange(procedure.procedure_id, e.target.checked)}
                      className="h-4 w-4 text-[#5C8E77] border-gray-300 rounded focus:ring-[#5C8E77]"
                    />
                    <label
                      htmlFor={`procedure-${procedure.procedure_id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {procedure.name}
                    </label>
                  </div>
                ))}
              </div>
              {errors.procedures && <p className="text-sm text-red-500">{errors.procedures}</p>}
              <p className="text-sm text-gray-500">You can select up to 2 procedures per activity.</p>
            </div>

            {/* Chair & Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="chair">Requested Chair</Label>
                <Input id="chair" value={formData.chair} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input id="instructor" value={formData.instructor} disabled className="bg-gray-50 text-gray-500" />
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