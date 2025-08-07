"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { GraduationCap, User, Settings, ClipboardList, HelpCircle, FilePlus, Search, X } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const backgroundImages = [
    "/images/landing-page/school-1.png", 
    "/images/landing-page/school-2.png"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    {
      icon: GraduationCap,
      title: "Clinical Instructor",
      href: "/landing/clinical-instructor",
    },
    {
      icon: User,
      title: "Clinician",
      href: "/landing/clinician",
    },
    {
      icon: Settings,
      title: "Chief of Clinicians",
      href: "/landing/chief-of-clinicians",
    },
    {
      icon: ClipboardList,
      title: "Clerk",
      href: "/landing/clerk",
    },
  ]

  const handleRoleSelect = (role: string, href: string) => {
    console.log(`Selected role: ${role}`)
    router.push(href)
  }

  // Debug function to test help button
  const handleHelpClick = () => {
    console.log("Help button clicked!")
    setShowHelpModal(true)
  }

  // Debug function to test modal close
  const handleCloseModal = () => {
    console.log("Closing help modal")
    setShowHelpModal(false)
  }

  // Debug function to test navigation
  const handleSupportNavigation = (path: string) => {
    console.log(`Navigating to: ${path}`)
    setShowHelpModal(false)
    router.push(path)
  }

  return (
    <div className="min-h-screen !pt-0 relative overflow-hidden font-poppins">
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl">
          <div className="p-8">
            {/* Logo & Header */}
            <div className="text-center mb-8">
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
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome</h1>
              <p className="text-sm text-gray-600">Please select your role to continue</p>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-4">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleRoleSelect(item.title, item.href)}
                  className="h-24 flex flex-col items-center justify-center gap-3 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <item.icon className="w-7 h-7 text-emerald-600" />
                  <span className="text-sm font-medium text-center leading-tight">{item.title}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">Academic Year 2024–2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button - Added debug logging and improved z-index */}
      <button
        onClick={handleHelpClick}
        className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 z-40"
        aria-label="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal()
            }
          }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">

            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={handleCloseModal}
              aria-label="Close help modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">What would you like to do?</h2>
              <p className="text-sm text-gray-600">Please choose an option below:</p>
            </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Submit a New Ticket */}
                <button
                  onClick={() => handleSupportNavigation("/support/new-ticket")}
                  className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 w-[240px] h-[200px] group"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <FilePlus className="w-8 h-8 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600 font-semibold">
                    Submit a New Ticket
                  </span>
                </button>

                {/* View My Tickets */}
                <button
                  onClick={() => handleSupportNavigation("/support/my-tickets")}
                  className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 w-[240px] h-[200px] group"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <Search className="w-8 h-8 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600 font-semibold">
                    View My Tickets
                  </span>
                </button>
              </div>

          </div>
        </div>
      )}
    </div>
  )
}
