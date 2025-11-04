import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import type React from "react"

export default function ChiefLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <RoleBasedSidebar role="chief-of-clinicians" />

      <div className="flex-1 sm:ml-64 w-full pt-16">
        <Header />
        <main className="bg-[#f9f9f9] min-h-screen p-6">{children}</main>
      </div>
    </div>
  )
}