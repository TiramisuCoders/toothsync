"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Bell,
  FileText,
  Search,
  LayoutGrid,
  Users,
  BarChartIcon as ChartBar,
  RockingChairIcon as Chair,
  ClipboardList,
  FormInput,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserRoleDropdown } from "@/components/user-role-dropdown"

interface DashboardLayoutProps {
  children: ReactNode
  currentRole?: "admin" | "instructor" | "clinician" | "clerk"
}

export function DashboardLayout({ children, currentRole = "admin" }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Determine the base URL based on the current role
  const getBaseUrl = () => {
    switch (currentRole) {
      case "instructor":
        return "/instructor-view"
      case "clerk":
        return "/clerk-view"
      case "clinician":
        return "/clinician-view"
      default:
        return ""
    }
  }

  const baseUrl = getBaseUrl()

  // Get the current page title
  const getPageTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard"
    if (pathname === "/instructor-view") return "Dashboard"
    if (pathname === "/clerk-view") return "Dashboard"
    if (pathname === "/clinician-view") return "Dashboard"

    if (pathname.includes("/attendance")) return "Attendance"
    if (pathname.includes("/clinicians")) return "Clinicians"
    if (pathname.includes("/activities")) return "Activities"
    if (pathname.includes("/chair")) return "Dental Chairs"
    if (pathname.includes("/instructor")) return "Instructor"
    if (pathname.includes("/reports")) return "Reports"
    if (pathname.includes("/records")) return "Records"
    if (pathname.includes("/form")) return "Attendance Form"

    return "Dashboard"
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans">
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
              {/* Dashboard - Available to all roles */}
              <Link
                href={baseUrl ? baseUrl : "/dashboard"}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === "/dashboard" ||
                  pathname === "/" ||
                  pathname === "/instructor-view" ||
                  pathname === "/clerk-view" ||
                  pathname === "/clinician-view"
                    ? "text-[#5C8E77] bg-[#e6f7eb]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <LayoutGrid
                  className={`h-4 w-4 ${
                    pathname === "/dashboard" ||
                    pathname === "/" ||
                    pathname === "/instructor-view" ||
                    pathname === "/clerk-view" ||
                    pathname === "/clinician-view"
                      ? "text-[#5C8E77]"
                      : "text-gray-500"
                  }`}
                />
                Dashboard
              </Link>

              {/* Admin-specific navigation in the requested sequence */}
              {currentRole === "admin" && (
                <>
                  {/* Attendance */}
                  <Link
                    href="/attendance"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/attendance")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 ${pathname.includes("/attendance") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Attendance
                  </Link>

                  {/* Clinicians */}
                  <Link
                    href="/clinicians"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/clinicians")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 ${pathname.includes("/clinicians") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Clinicians
                  </Link>

                  {/* Activities */}
                  <Link
                    href="/activities"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/activities")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 ${pathname.includes("/activities") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Activities
                  </Link>

                  {/* Dental Chairs */}
                  <Link
                    href="/chair"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/chair") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Chair className={`h-4 w-4 ${pathname.includes("/chair") ? "text-[#5C8E77]" : "text-gray-500"}`} />
                    Dental Chairs
                  </Link>

                  {/* Instructor */}
                  <Link
                    href="/instructor"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/instructor") && !pathname.includes("/instructor-view")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 ${
                        pathname.includes("/instructor") && !pathname.includes("/instructor-view")
                          ? "text-[#5C8E77]"
                          : "text-gray-500"
                      }`}
                    />
                    Instructor
                  </Link>

                  {/* Reports */}
                  <Link
                    href="/reports"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/reports") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ChartBar
                      className={`h-4 w-4 ${pathname.includes("/reports") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Reports
                  </Link>
                </>
              )}

              {/* Instructor role navigation */}
              {currentRole === "instructor" && (
                <>
                  <Link
                    href="/instructor-view/attendance"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/attendance")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 ${pathname.includes("/attendance") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Attendance
                  </Link>

                  <Link
                    href="/instructor-view/clinicians"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/clinicians")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 ${pathname.includes("/clinicians") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Clinicians
                  </Link>

                  <Link
                    href="/instructor-view/activities"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/activities")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 ${pathname.includes("/activities") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Activities
                  </Link>
                </>
              )}

              {/* Clerk role navigation */}
              {currentRole === "clerk" && (
                <>
                  <Link
                    href="/clerk-view/attendance"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/attendance")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Calendar
                      className={`h-4 w-4 ${pathname.includes("/attendance") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Attendance
                  </Link>

                  <Link
                    href="/clerk-view/chair"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/chair") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Chair className={`h-4 w-4 ${pathname.includes("/chair") ? "text-[#5C8E77]" : "text-gray-500"}`} />
                    Dental Chairs
                  </Link>
                </>
              )}

              {/* Clinician role navigation */}
              {currentRole === "clinician" && (
                <>
                  <Link
                    href="/clinician-view/activities"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/activities")
                        ? "text-[#5C8E77] bg-[#e6f7eb]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 ${pathname.includes("/activities") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Activities
                  </Link>

                  <Link
                    href="/clinician-view/chair"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/chair") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Chair className={`h-4 w-4 ${pathname.includes("/chair") ? "text-[#5C8E77]" : "text-gray-500"}`} />
                    Dental Chairs
                  </Link>

                  <Link
                    href="/clinician-view/records"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/records") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ClipboardList
                      className={`h-4 w-4 ${pathname.includes("/records") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Records
                  </Link>

                  <Link
                    href="/clinician-view/form"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                      pathname.includes("/form") ? "text-[#5C8E77] bg-[#e6f7eb]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FormInput
                      className={`h-4 w-4 ${pathname.includes("/form") ? "text-[#5C8E77]" : "text-gray-500"}`}
                    />
                    Form
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#333]">{getPageTitle()}</h1>
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
            <UserRoleDropdown currentRole={currentRole} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
