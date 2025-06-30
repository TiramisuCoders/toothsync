"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Sample procedures
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
    yearLevel: "5th Year", // Add year level
    section: "A", // Add section
    patientName: "",
    procedure: "", // Keep for backward compatibility
    selectedProcedures: [],
    chair: "Auto-assigned",
    instructor: "Auto-assigned",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProcedureCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target

    setFormData((prev) => {
      // If checked, add to array (if not already at max 2)
      if (checked) {
        // If already has 2 procedures selected, don't add more
        if (prev.selectedProcedures.length >= 2) {
          return prev
        }
        return {
          ...prev,
          selectedProcedures: [...prev.selectedProcedures, value],
        }
      }
      // If unchecked, remove from array
      else {
        return {
          ...prev,
          selectedProcedures: prev.selectedProcedures.filter((p) => p !== value),
        }
      }
    })
  }

  const handleProcedureChange = (value: string) => {
    setFormData((prev) => ({ ...prev, procedure: value }))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target
    setFormData((prev) => ({ ...prev, yearLevel: value }))
  }

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target
    setFormData((prev) => ({ ...prev, section: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Attendance Submitted",
        description: "Your attendance has been submitted and is pending approval.",
      })

      // Reset form
      setFormData({
        firstName: "Maria",
        lastName: "Santos",
        yearLevel: "5th Year",
        section: "A",
        patientName: "",
        procedure: "",
        selectedProcedures: [],
        chair: "Auto-assigned",
        instructor: "Auto-assigned",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Attendance Form</h1>

      <Card className="w-full max-w-2xl mx-auto shadow-md">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-semibold text-[#5C8E77]">Submit Attendance</CardTitle>
          <CardDescription>
            Fill out this form to initiate the attendance process. Chair and instructor will be auto-assigned.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearLevel" className="font-medium">
                  Year Level
                </Label>
                <select
                  id="yearLevel"
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleYearChange}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                >
                  <option value="5th Year">5th Year</option>
                  <option value="6th Year">6th Year</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="font-medium">
                  Section
                </Label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleSectionChange}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientName" className="font-medium">
                Patient Name
              </Label>
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="Enter patient name"
                required
                className="focus:border-[#5C8E77] focus:ring-[#5C8E77]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedures" className="font-medium">
                Procedures (Select up to 2)
              </Label>
              <div className="grid grid-cols-2 gap-3 border border-gray-200 rounded-md p-3">
                {procedures.map((procedure) => (
                  <div key={procedure} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`procedure-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                      name="procedures"
                      value={procedure}
                      checked={formData.selectedProcedures?.includes(procedure) || false}
                      onChange={handleProcedureCheckboxChange}
                      className="h-4 w-4 rounded border-gray-300 text-[#5C8E77] focus:ring-[#5C8E77]"
                    />
                    <label
                      htmlFor={`procedure-${procedure.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-gray-700"
                    >
                      {procedure}
                    </label>
                  </div>
                ))}
              </div>
              {formData.selectedProcedures?.length > 2 && (
                <p className="text-xs text-red-500">You can select a maximum of 2 procedures.</p>
              )}
              {formData.selectedProcedures?.length === 0 && (
                <p className="text-xs text-red-500">Please select at least one procedure.</p>
              )}
              <p className="text-xs text-gray-500">You can select up to 2 procedures per activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="chair" className="font-medium">
                  Requested Chair
                </Label>
                <Input id="chair" name="chair" value={formData.chair} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Auto-assigned based on procedure</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor" className="font-medium">
                  Instructor
                </Label>
                <Input id="instructor" name="instructor" value={formData.instructor} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Auto-assigned based on expertise</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-[#5C8E77] hover:bg-[#4a7c65] font-medium py-2"
              disabled={isSubmitting}
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
