"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function ClerkSignUpForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const clearError = () => {
    setErrorMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

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

    if (!formData.studentId) {
      setErrorMessage("Student ID is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/clerk-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to sign up")
        setIsLoading(false)
        return
      }

      setSuccessMessage(data.message)
      setSignupComplete(true)
      setIsLoading(false)
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleContinueToLogin = () => {
    router.push("/landing/clerk?signup=success")
  }

  if (signupComplete) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">Sign-up Successful!</h3>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Your account is now pending for approval from the admin. You'll gain full access once your account is
                verified.
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleContinueToLogin} className="w-full bg-emerald-600 hover:bg-emerald-700">
          Continue to Login
        </Button>
      </div>
    )
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

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-xs text-gray-500">You must be an enrolled clinician to sign up as a clerk</p>
        </div>

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
