"use client"

import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import React, { useEffect, useState } from "react"
import IdleTimeout from "@/components/IdleTimeout" // ✅ required

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"clinician" | "clinical-instructor" | "clerk" | "chief-of-clinicians">("clinician")

  useEffect(() => {
    const cookieRole = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1]

    const roleMap: Record<string, "clinician" | "clinical-instructor" | "clerk" | "chief-of-clinicians"> = {
      clinician: "clinician",
      clerk: "clerk",
      "clinical-instructor": "clinical-instructor",
      "chief-of-clinicians": "chief-of-clinicians",
    }

    const sidebarRole = roleMap[cookieRole || "clinician"] || "clinician"
    setRole(sidebarRole)
  }, [])

  return (
    <>
      {/* ✅ global idle timeout */}
      <IdleTimeout />

      <div className="flex">
        <RoleBasedSidebar role={role} />

        <div className="flex-1 sm:ml-64 w-full pt-16">
          <Header />
          <main className="bg-[#f9f9f9] min-h-screen p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
