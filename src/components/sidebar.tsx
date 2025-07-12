"use client"

import {
  LayoutDashboard,
  Users,
  Calendar,
  Armchair,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Clinicians", href: "/clinicians", icon: Users },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Dental Chairs", href: "/dental-chairs", icon: Armchair },
  { name: "Instructor", href: "/instructor", icon: GraduationCap },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Incident Logs", href: "/incident-logs", icon: AlertTriangle },
  { name: "Activity Logs", href: "/activity-logs", icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#5c8e77" }}>
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">ToothSync</h1>
        </div>
      </div>

      {/* College Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "#e1ede8" }}>
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: "#5c8e77" }}></div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900">De Ocampo Memorial College</h2>
            <p className="text-xs text-gray-500">845 Lucid Avenue, Manila</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  style={isActive ? { backgroundColor: "#5c8e77" } : {}}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
