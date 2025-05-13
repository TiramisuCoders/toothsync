"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    patientName: "",
    procedure: "",
    chair: "Auto-assigned",
    instructor: "Auto-assigned",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProcedureChange = (value: string) => {
    setFormData((prev) => ({ ...prev, procedure: value }))
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
        patientName: "",
        procedure: "",
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
              <Label htmlFor="procedure" className="font-medium">
                Procedure
              </Label>
              <Select value={formData.procedure} onValueChange={handleProcedureChange} required>
                <SelectTrigger id="procedure" className="focus:ring-[#5C8E77]">
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((procedure) => (
                    <SelectItem key={procedure} value={procedure}>
                      {procedure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
