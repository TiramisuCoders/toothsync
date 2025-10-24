"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutGrid,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  FormInput,
  AlertTriangle,
  ActivityIcon,
  Clock,
  Armchair as Chair,
  BarChartBig as ChartBar,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react"

import { sidebarMenuConfig, type UserRole } from "@/components/sidebar/sidebar-config"

interface RoleBasedSidebarProps {
  role: UserRole
}

const getIconForTitle = (title: string): LucideIcon => {
  switch (title) {
    case "Dashboard":
      return LayoutGrid
    case "Attendance":
      return Calendar
    case "Clinicians":
      return Users
    case "Clerks":
      return Users
    case "Activities":
      return FileText
    case "Dental Chairs":
      return Chair
    case "Instructor":
      return Users
    case "Reports":
      return ChartBar
    case "Incident Logs":
      return AlertTriangle
    case "Activity Logs":
      return ActivityIcon
    case "Records":
      return ClipboardList
    case "Form":
      return FormInput
    case "Schedule":
      return Clock
    default:
      return FileText
  }
}

const isPathActive = (pathname: string, href: string): boolean => {
  // Exact match or starts with the href followed by a slash
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const RoleBasedSidebar = ({ role }: RoleBasedSidebarProps) => {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menu = sidebarMenuConfig[role]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarOpen])

  return (
    <>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-drawer-target="sidebar-menu"
        data-drawer-toggle="sidebar-menu"
        aria-controls="sidebar-menu"
        aria-expanded={sidebarOpen}
        type="button"
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <span className="sr-only">{sidebarOpen ? "Close sidebar" : "Open sidebar"}</span>
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        id="sidebar-menu"
        className={`fixed top-0 left-0 z-50 w-64 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 bg-white border-r border-gray-200`}
        aria-label="Main navigation"
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo and header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#5C8E77] rounded-lg flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/tslogo1.png"
                  alt="ToothSync Logo"
                  width={30}
                  height={30}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
              <span className="text-xl font-semibold text-gray-900">ToothSync</span>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/DOMC-logo.png"
                  alt="De Ocampo Memorial College Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">De Ocampo Memorial College</h3>
                <p className="text-xs text-gray-500 mt-1">845 Euclid Avenue, Manila</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <nav>
            <ul className="space-y-2 font-medium">
              {menu.map((item) => {
                const isActive = isPathActive(pathname, item.href)
                const Icon = getIconForTitle(item.label)

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#5C8E77]/10 text-[#5C8E77]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#5C8E77]" : "text-gray-500"}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
