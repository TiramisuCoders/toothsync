"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import React, { useEffect, useState } from "react"

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"clinician" | "instructor" | "clerk" | "chief">("clinician")

  useEffect(() => {
    // Get role from cookie
    const cookieRole = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1]

    // Map role to sidebar role type
    const roleMap: Record<string, "clinician" | "instructor" | "clerk" | "chief"> = {
      "clinician": "clinician",
      "clerk": "clerk",
      "clinical-instructor": "instructor",
      "chief-of-clinicians": "chief"
    }

    const sidebarRole = roleMap[cookieRole || "clinician"] || "clinician"
    setRole(sidebarRole)
  }, [])

  return (
    <SidebarProvider>
      <RoleBasedSidebar role={role} />
      <SidebarInset>
        <Header />
        <main className="bg-[#f9f9f9] min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}