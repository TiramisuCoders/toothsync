"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/client"

interface SignUpFormProps {
  role: string
}

const roleToRoleId: Record<string, string> = {
  "clinical-instructor": "R03",
  clinician: "R01",
  "chief-of-clinicians": "R04",
  clerk: "R02",
}

export function SignUpForm({ role }: SignUpFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    studentId: "",
    yearLevel: "",
    section: "",
    agreedToTerms: false,
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const requiresEmployeeId = role === "clinical-instructor" || role === "chief-of-clinicians"
  const requiresStudentFields = role === "clinician" || role === "clerk"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearError = () => {
    setErrorMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.agreedToTerms) {
      setErrorMessage("You must agree to the Terms and Conditions and Privacy Policy")
      return
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long")
      return
    }

    if (requiresEmployeeId && !formData.employeeId) {
      setErrorMessage("Employee ID is required")
      return
    }

    if (requiresStudentFields) {
      if (!formData.studentId) {
        setErrorMessage("Student ID is required")
        return
      }
      if (!formData.yearLevel) {
        setErrorMessage("Year Level is required")
        return
      }
      if (!formData.section) {
        setErrorMessage("Section is required")
        return
      }
    }

    setIsLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (authError) {
        setErrorMessage(authError.message)
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setErrorMessage("Failed to create account")
        setIsLoading(false)
        return
      }

      const userData: any = {
        auth_user_id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: roleToRoleId[role] || "R01",
      }

      if (requiresEmployeeId) {
        userData.employee_id = formData.employeeId
      }

      if (requiresStudentFields) {
        userData.student_id = formData.studentId
        userData.year_level = formData.yearLevel
        userData.section = formData.section
      }

      const { error: userError } = await supabase.from("users").insert([userData])

      if (userError) {
        setErrorMessage("Failed to create user profile")
        setIsLoading(false)
        return
      }

      // Redirect to login page
      router.push(`/landing/${role}?signup=success`)
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
            <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@domc.edu.ph"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {requiresEmployeeId && (
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              name="employeeId"
              placeholder="EMP001"
              value={formData.employeeId}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        )}

        {requiresStudentFields && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearLevel">Year Level</Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) => handleSelectChange("yearLevel", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="yearLevel">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => handleSelectChange("section", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                    <SelectItem value="D">Section D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                name="studentId"
                placeholder="2024-00001"
                value={formData.studentId}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={formData.agreedToTerms}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreedToTerms: checked as boolean }))}
            disabled={isLoading}
          />
          <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
            I agree to the <span className="text-emerald-600 hover:underline">Terms and Conditions</span> and{" "}
            <span className="text-emerald-600 hover:underline">Privacy Policy</span>
          </label>
        </div>

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </>
  )
}
