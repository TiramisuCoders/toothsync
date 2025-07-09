"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function ClinicianLoginPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const backgroundImages = [
    "/images/landing-page/school-1.png",
    "/images/landing-page/school-2.png",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt:", { email, password, rememberMe })
  }

  const handleBackToRoleSelection = () => {
    window.location.href = "/landing"
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
              src={image}
              alt={`Background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-emerald-600/60" />
          </div>
        ))}
      </div>

      {/* Login Form Box */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/DOMC-logo.png"
              alt="App Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Sign in</h1>
            <p className="text-gray-600">
              Logging in as <span className="font-semibold text-emerald-600">Clinician</span>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  required
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-600"
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={handleBackToRoleSelection}
              className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 px-4 rounded-md font-medium transition-colors duration-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              Back to role selection
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
