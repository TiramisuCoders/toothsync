import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/sidebar/RoleBasedSidebar"
import { Header } from "@/components/layouts/header"
import React from "react"

export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RoleBasedSidebar role="clerk" />
      <SidebarInset>
        <Header />
        <main className="bg-[#f9f9f9] min-h-screen p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
