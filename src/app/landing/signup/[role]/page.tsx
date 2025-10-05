"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { SignUpForm } from "@/components/auth/signup-form"

const roleDisplayNames = {
  "clinical-instructor": "Clinical Instructor",
  clinician: "Clinician",
  "chief-of-clinicians": "Chief of Clinicians",
  clerk: "Clerk",
}

export default function SignUpPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const params = useParams()
  const role = params.role as string

  const backgroundImages = ["/images/landing-page/school-1.png", "/images/landing-page/school-2.png"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  if (!roleDisplayNames[role as keyof typeof roleDisplayNames]) {
    notFound()
  }

  const roleDisplayName = roleDisplayNames[role as keyof typeof roleDisplayNames]

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl border-0">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/images/DOMC-logo.png"
                alt="De Ocampo Memorial College"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">
              Signing up as <span className="text-emerald-600 font-semibold">{roleDisplayName}</span>
            </p>
          </div>

          <SignUpForm role={role} />

          <div className="mt-6 space-y-3">
            <Link href={`/landing/${role}`} className="block">
              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Already have an account? Sign in
              </Button>
            </Link>
            <div className="text-center">
              <Link href="/landing" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                Back to role selection
              </Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">Academic Year 2024-2025</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
