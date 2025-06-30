"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Bell, FileText, Search, LayoutGrid, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserRoleDropdown } from "@/components/user-role-dropdown"
import { Suspense } from "react"

// Font configuration
const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function InstructorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Function to check if a path is active
  const isActive = (path: string) => {
    if (!isMounted) return false
    if (path === "/instructor-view" || path === "/instructor-view/") {
      return pathname === "/instructor-view" || pathname === "/instructor-view/"
    }
    return pathname?.includes(path)
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa]" style={poppinsFont}>
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200">
          <div className="bg-[#5C8E77] rounded-md p-2 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
              <path d="M12 11v4" />
              <path d="M11 15h2" />
            </svg>
          </div>
          <span className="font-semibold text-xl text-[#333]">ToothSync</span>
        </div>

        {/* Clinic Info */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center">
            <Image
              src="/images/de-ocampo-logo.png"
              alt="De Ocampo Memorial College logo"
              width={40}
              height={40}
              className="rounded-md"
            />
          </div>
          <div>
            <div className="font-semibold text-[#333]">De Ocampo Memorial College</div>
            <div className="text-xs text-gray-500">845 Euclid Avenue, Manila</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <nav className="space-y-1">
              <Link
                href="/instructor-view"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/instructor-view") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <LayoutGrid
                  className={`h-4 w-4 ${isActive("/instructor-view") ? "text-[#5C8E77]" : "text-gray-500"}`}
                />
                Dashboard
              </Link>
              <Link
                href="/instructor-view/attendance"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/instructor-view/attendance")
                    ? "text-[#5C8E77] bg-[#e6f7eb]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Calendar
                  className={`h-4 w-4 ${isActive("/instructor-view/attendance") ? "text-[#5C8E77]" : "text-gray-500"}`}
                />
                Attendance
              </Link>
              <Link
                href="/instructor-view/clinicians"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/instructor-view/clinicians")
                    ? "text-[#5C8E77] bg-[#e6f7eb]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Users
                  className={`h-4 w-4 ${isActive("/instructor-view/clinicians") ? "text-[#5C8E77]" : "text-gray-500"}`}
                />
                Clinicians
              </Link>
              <Link
                href="/instructor-view/activities"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  isActive("/instructor-view/activities")
                    ? "text-[#5C8E77] bg-[#e6f7eb]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText
                  className={`h-4 w-4 ${isActive("/instructor-view/activities") ? "text-[#5C8E77]" : "text-gray-500"}`}
                />
                Activities
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-[#333]">
              {!isMounted
                ? "Loading..."
                : isActive("/instructor-view") || isActive("/instructor-view/")
                  ? "Dashboard"
                  : isActive("/instructor-view/attendance")
                    ? "Attendance"
                    : isActive("/instructor-view/clinicians")
                      ? "Clinicians"
                      : isActive("/instructor-view/activities")
                        ? "Activities"
                        : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for anything here..."
                className="w-64 pl-9 rounded-full bg-gray-100 border-gray-200 focus-visible:ring-[#5C8E77]/30"
              />
            </div>
            <Button size="icon" variant="ghost" className="relative text-gray-500 hover:text-[#333] hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#5C8E77] text-white text-xs flex items-center justify-center">
                1
              </span>
            </Button>
            <UserRoleDropdown currentRole="instructor" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
