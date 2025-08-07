"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"

export default function ClinicianForm() {
  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "",
    yearLevel: "", 
    section: "",   
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
  // const [procedures, setProcedures] = useState<string[]>([])
  const [procedures, setProcedures] = useState<{ procedure_id: string; name: string }[]>([])

  
  useEffect(() => {
    const fetchData = async () => {

    const { data: userData, error: userError } = await supabase.auth.getUser()
    // console.log(userData); // Must not be null
    if (userError || !userData.user) {
      console.error("User not authenticated:", userError)
      return
    }
    if (!userError && userData.user) {
      setFormData((prev) => ({
        ...prev,
        clinicianUserId: userData.user.id,  // store the ID here
      }))
    }

    const { data: clinician, error: clinicianError } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("auth_user_id", userData.user.id)
      .single()

    if (clinicianError) {
      console.error("Failed to fetch clinician data:", clinicianError)
    } else {
      setFormData((prev) => ({
        ...prev,
        firstName: clinician.first_name,
        lastName: clinician.last_name,
        // yearLevel: profile.year_level,
        // section: profile.section,
      }))
    }

    const { data: clin, error: clinError } = await supabase
      .from("clinicians")
      .select("year_level")
      .eq("user_id", userData.user.id)
      .single()

    if (clinError) {
      console.error("Failed to fetch student profile:", clinError)
    } else {
      setFormData((prev) => ({
        ...prev,
        yearLevel: clin.year_level,
      }))
    }

    

    const { data: procedureData, error: procedureError } = await supabase
      .from("procedure")
      .select("procedure_id, name")

    if (procedureError) {
      console.error("Error fetching procedures:", procedureError)
    } else {
      const procedureNames = procedureData.map((p) => p.name)
      setProcedures(procedureData)
    }
  }

  fetchData()
}, [])


  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, patientName: e.target.value }))
    if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: "" }))
  }

  const handleProcedureChange = (procedure: string, checked: boolean) => {
    setFormData((prev) => {
      let newProcedures = [...prev.selectedProcedures]

      if (checked) {
        if (newProcedures.length >= 2) return prev
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

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required"
    }

    if (formData.selectedProcedures.length === 0) {
      newErrors.procedures = "Please select at least one procedure"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const simulateSubmission = async () => {
    setSubmitProgress(0)
    const steps = [25, 50, 75, 100]

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSubmitProgress(step)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await simulateSubmission()

      const { data: latest, error: fetchError } = await supabase
        .from("request")
        .select("request_id")
        .order("createdAt", { ascending: false })
        .limit(1)

      let newReqId;
      const year = new Date().getFullYear();

      if (fetchError || !latest || latest.length === 0) {
        console.error("Error fetching latest request ID:", fetchError);
        // If no previous request or fetch failed, start with 0001
        newReqId = `RQST${year}-0001`;
      } else {
        const lastId = latest[0].request_id; // e.g., "RQST2025-0007"
        const lastNumber = parseInt(lastId.split("-")[1], 10); // Extract "0007" and convert to number
        const nextNumber = lastNumber + 1;
        newReqId = `RQST${year}-${nextNumber.toString().padStart(4, "0")}`;
      }

      const { error: insertError } = await supabase.from("request").insert({
        request_id: newReqId,
        patient_name: formData.patientName,
        clinician_id: formData.clinicianUserId,
      })

      if (insertError) {
        console.error("Failed to insert request:", insertError)
        throw new Error("Failed to submit attendance")
      }

      const procedureRows = formData.selectedProcedures.map((procedureId) => ({
        rp_id: `${newReqId}-${procedureId}`,
        request_id: newReqId,
        procedure_id: procedureId,
      }))

    console.log(procedureRows)

      const { data: insertData, error: joinError } = await supabase
        .from("Requested_Procedures")
        .insert(procedureRows)

      console.log("Insert result:", insertData)
      console.error("Insert error:", joinError)


      // Then show success toast
      toast(  
        <div>
          <span className="font-semibold">Attendance Submitted</span>
          <div className="text-sm text-gray-700">Your attendance has been submitted and is pending approval.</div>
        </div>
      )

      setShowConfirmation(true)

      setFormData((prev) => ({
        ...prev,
        patientName: "",
        selectedProcedures: [],
      }))
      setSubmitProgress(0)

      setTimeout(() => setShowConfirmation(false), 5000)
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearLevel">Year Level</Label>
                <Input id="yearLevel" value={formData.yearLevel} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input id="section" value={formData.section} disabled className="bg-gray-50 text-gray-500" />
              </div>
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
              {formData.selectedProcedures.length === 0 && (
                <p className="text-sm text-red-500">Please select at least one procedure.</p>
              )}
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