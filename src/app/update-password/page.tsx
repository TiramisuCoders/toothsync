// app/update-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
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
  const [isVerifying, setIsVerifying] = useState(true)
  const [sessionEmail, setSessionEmail] = useState<string>("")
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

  // Verify session and handle recovery
  useEffect(() => {
    let mounted = true

    const verifyRecoverySession = async () => {
      try {
        console.log('Starting recovery session verification...')
        
        // Check URL for errors first
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const error = hashParams.get('error')
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (error || errorCode) {
          if (!mounted) return
          
          let message = 'The password reset link is invalid or has expired.'
          if (errorCode === 'otp_expired') {
            message = 'This password reset link has expired. Please request a new one.'
          } else if (errorDescription) {
            message = errorDescription.replace(/\+/g, ' ')
          }
          
          setErrorMessage(message)
          setHasError(true)
          setIsVerifying(false)
          return
        }

        // Give Supabase time to process the hash fragment
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check for session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('Session error:', sessionError)
          setErrorMessage('Unable to verify your session. Please request a new password reset link.')
          setHasError(true)
          setIsVerifying(false)
          return
        }

        if (!session) {
          console.error('No session found after recovery')
          setErrorMessage('Could not establish session. Please click the reset link from your email again.')
          setHasError(true)
          setIsVerifying(false)
          return
        }

        console.log('✓ Recovery session verified for:', session.user.email)
        setSessionEmail(session.user.email || '')
        setIsVerifying(false)

      } catch (error) {
        console.error('Recovery verification error:', error)
        if (mounted) {
          setErrorMessage('An error occurred. Please try clicking the reset link again.')
          setHasError(true)
          setIsVerifying(false)
        }
      }
    }

    verifyRecoverySession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      console.log('Auth state:', event, session?.user?.email || 'no session')
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('✓ Password recovery session established')
        setSessionEmail(session.user.email || '')
        setIsVerifying(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
      setErrorMessage("Please use a stronger password")
      setHasError(true)
      triggerShakeAnimation()
      return
    }

    setIsLoading(true)

    try {
      // Double-check session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session expired. Please request a new reset link.')
      }

      console.log('Updating password for:', session.user.email)

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      console.log('✓ Password updated successfully')
      setSuccessMessage("Password updated successfully! Redirecting...")
      
      // Sign out
      await supabase.auth.signOut()
      
      // Redirect
      setTimeout(() => {
        router.push("/landing")
      }, 2000)

    } catch (error: any) {
      console.error("Password update error:", error)
      
      let errorMsg = "Failed to update password."
      if (error.message?.includes('session') || error.message?.includes('Session')) {
        errorMsg = "Your session expired. Please request a new reset link."
      } else if (error.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
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

  const handleRequestNewLink = () => {
    router.push("/landing")
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

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Verifying your reset link...</p>
          <p className="text-sm mt-2 opacity-80">This may take a moment</p>
        </div>
      </div>
    )
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
            {sessionEmail && (
              <p className="text-gray-600 text-sm mb-2">
                for <span className="font-medium">{sessionEmail}</span>
              </p>
            )}
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
                  {hasError && (
                    <button
                      onClick={handleRequestNewLink}
                      className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
                    >
                      Go back to login
                    </button>
                  )}
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

          {/* Show form only if no error */}
          {!hasError && (
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
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
            </form>
          )}

          {/* Back to Login */}
          <button
            type="button"
            onClick={() => router.push("/landing")}
            disabled={isLoading}
            className="w-full mt-4 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 px-4 rounded-md font-medium transition-colors duration-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Login
          </button>
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