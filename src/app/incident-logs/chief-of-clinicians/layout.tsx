// src/app/incident-logs/chief-of-clinicians/layout.tsx

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import React from "react"

export default function ChiefLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RoleBasedSidebar role="chief-of-clinicians" />
      <SidebarInset>
        {/* <Header /> */}
        <div className="flex-1 sm:ml-64 pt-16">
        <Header />
        <main className="bg-[#f9f9f9] min-h-screen p-6">{children}</main>
      </div>
      </SidebarInset>
    </SidebarProvider>
  )
}