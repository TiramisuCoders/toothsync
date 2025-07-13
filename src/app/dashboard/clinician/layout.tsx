// src/app/dashboard/clinician/layout.tsx
import { SidebarProvider, SidebarInset } from "@/components/sidebar/Sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header" // or wherever your header is
import React from "react"

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RoleBasedSidebar role="clinician" />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}