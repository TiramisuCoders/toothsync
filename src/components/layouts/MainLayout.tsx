"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { Header } from "@/components/layouts/header"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const role = pathname.split("/")[2] // gets role like 'clinician' from /dashboard/clinician

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1">
        <Header role={role} />
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
