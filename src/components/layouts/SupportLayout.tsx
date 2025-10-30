"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import React from "react"

type UserRole = "clinician" | "clerk" | "clinical-instructor" | "chief-of-clinicians" | null

function SupportLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncRole = () => {
      const cookieRole = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1] as UserRole

      const localRole = localStorage.getItem("role") as UserRole

      const role = cookieRole || localRole

      console.log("[Support Layout] Role sync - Cookie:", cookieRole, "Local:", localRole, "Using:", role)

      if (!role) {
        console.warn("[Support Layout] No role found, redirecting to landing")
        router.push("/")
        return
      }

      setUserRole(role)
      setIsLoading(false)

      if (cookieRole && cookieRole !== localRole) {
        localStorage.setItem("role", cookieRole)
      }
    }

    syncRole()

    const handleStorageChange = () => {
      syncRole()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", syncRole)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", syncRole)
    }
  }, [router])

  const getSidebarRole = (role: UserRole): "clinician" | "instructor" | "clerk" | "chief" | null => {
    if (!role) return null
    
    const roleMap: Record<string, "clinician" | "instructor" | "clerk" | "chief"> = {
      "clinician": "clinician",
      "clinical-instructor": "instructor",
      "clerk": "clerk",
      "chief-of-clinicians": "chief",
    }
    
    return roleMap[role] || null
  }

  const sidebarRole = getSidebarRole(userRole)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!sidebarRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <RoleBasedSidebar role={sidebarRole} />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SupportLayout