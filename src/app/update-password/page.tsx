// app/update-password/page.tsx
"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recoveryCode = searchParams.get("code")
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isShaking, setIsShaking] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    feedback: string
  }>({ score: 0, feedback: "" })

  const backgroundImages = ["/images/landing-page/school-1.png", "/images/landing-page/school-2.png"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Password strength validator
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength({ score: 0, feedback: "" })
      return
    }

    let score = 0
    let feedback = ""

    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) {
      feedback = "Weak password"
    } else if (score === 3) {
      feedback = "Fair password"
    } else if (score === 4) {
      feedback = "Good password"
    } else {
      feedback = "Strong password"
    }

    setPasswordStrength({ score, feedback })
  }, [password])

  const triggerShakeAnimation = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 600)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setHasError(false)

    // Validation
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      setHasError(true)
      triggerShakeAnimation()
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      setHasError(true)
      triggerShakeAnimation()
      return
    }

    if (passwordStrength.score < 3) {
      setErrorMessage("Please use a stronger password with uppercase, lowercase, numbers, and symbols")
      setHasError(true)
      triggerShakeAnimation()
      return
    }

    setIsLoading(true)

    try {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // If there's a recovery code, exchange it first to establish a session
      if (recoveryCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryCode)
        if (exchangeError) {
          throw new Error(`Session exchange failed: ${exchangeError.message}`)
        }
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccessMessage("Password updated successfully! Redirecting to login...")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/landing")
      }, 2000)

    } catch (error: any) {
      console.error("Error updating password:", error)
      setErrorMessage(error.message || "Failed to update password. Please try again or request a new reset link.")
      setHasError(true)
      triggerShakeAnimation()
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setErrorMessage("")
    setHasError(false)
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500"
    if (passwordStrength.score === 3) return "bg-yellow-500"
    if (passwordStrength.score === 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getStrengthWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0">
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

      {/* Form Box */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 transition-transform duration-300 ${
            isShaking ? "animate-shake" : ""
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Set New Password</h1>
            <p className="text-gray-600 text-sm">
              Please create a strong password for your account
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown">
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

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slideDown">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                    hasError ? "border-red-300 bg-red-50 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: getStrengthWidth() }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{passwordStrength.feedback}</p>
                </div>
              )}

              {/* Password Requirements */}
              <div className="text-xs text-gray-600 space-y-1 mt-2">
                <p className="font-medium">Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li className={password.length >= 8 ? "text-green-600" : ""}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-600" : ""}>
                    Uppercase and lowercase letters
                  </li>
                  <li className={/\d/.test(password) ? "text-green-600" : ""}>
                    At least one number
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600" : ""}>
                    At least one special character
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                    hasError ? "border-red-300 bg-red-50 focus:ring-red-500" : "border-gray-300"
                  }`}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600">Passwords match ✓</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || successMessage !== ""}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => router.push("/landing")}
              disabled={isLoading}
              className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 px-4 rounded-md font-medium transition-colors duration-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}