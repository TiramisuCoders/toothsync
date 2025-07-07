"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  GraduationCap,
  User,
  Settings,
  ClipboardList,
  HelpCircle,
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const backgroundImages = [
    "/landing-page/school-1.png",
    "/landing-page/school-2.png",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length
      )
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
      href: "/landing/chief-of-clinician",
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

  return (
    <div className="min-h-screen relative overflow-hidden font-poppins">
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl">
          <div className="p-8">
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Image
                  src="/DOMC-logo.png"
                  alt="App Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome
              </h1>
              <p className="text-sm text-gray-600">
                Please select your role to continue
              </p>
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
                  <span className="text-sm font-medium text-center leading-tight">
                    {item.title}
                  </span>
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

      {/* Help Button */}
      <button className="absolute bottom-6 right-6 w-12 h-12 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  )
}
