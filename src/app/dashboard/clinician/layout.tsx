import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
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
