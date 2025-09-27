// ClientLayoutWrapper.tsx
"use client"

import { usePathname } from "next/navigation"
import SyncUserRole from "@/components/SyncUserRole" // 👈 ADD THIS LINE

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/" || pathname.startsWith("/landing")

  return (
    <div className={isLandingPage ? "" : "pt-16"}>
      <SyncUserRole /> 
      {children}
    </div>
  )
}
