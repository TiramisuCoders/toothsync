"use client"

import { usePathname } from "next/navigation"

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Apply padding only if not on landing page
  const isLandingPage = pathname === "/" || pathname.startsWith("/landing")

  return (
    <div className={isLandingPage ? "" : "pt-16"}>
      {children}
    </div>
  )
}
