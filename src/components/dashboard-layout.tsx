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
  BarChart3,
  Armchair,
  ClipboardList,
  FormInput,
  AlertTriangle,
  Activity,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
    if (pathname.includes("/incident-logs")) return "Incident Logs"
    if (pathname.includes("/activity-logs")) return "Activity Logs"
    return "Dashboard"
  }

  // Navigation items based on role
  const getNavigationItems = () => {
    const dashboardItem = {
      title: "Dashboard",
      url: baseUrl ? baseUrl : "/dashboard",
      icon: LayoutGrid,
      isActive:
        pathname === "/dashboard" ||
        pathname === "/" ||
        pathname === "/instructor-view" ||
        pathname === "/clerk-view" ||
        pathname === "/clinician-view",
    }

    const commonItems = [dashboardItem]

    if (currentRole === "admin") {
      return [
        ...commonItems,
        {
          title: "Attendance",
          url: "/attendance",
          icon: Calendar,
          isActive: pathname.includes("/attendance"),
        },
        {
          title: "Clinicians",
          url: "/clinicians",
          icon: Users,
          isActive: pathname.includes("/clinicians"),
        },
        {
          title: "Activities",
          url: "/activities",
          icon: FileText,
          isActive: pathname.includes("/activities"),
        },
        {
          title: "Dental Chairs",
          url: "/chair",
          icon: Armchair,
          isActive: pathname.includes("/chair"),
        },
        {
          title: "Instructor",
          url: "/instructor",
          icon: Users,
          isActive: pathname.includes("/instructor") && !pathname.includes("/instructor-view"),
        },
        {
          title: "Reports",
          url: "/reports",
          icon: BarChart3,
          isActive: pathname.includes("/reports"),
        },
        {
          title: "Incident Logs",
          url: "/incident-logs",
          icon: AlertTriangle,
          isActive: pathname.includes("/incident-logs"),
        },
        {
          title: "Activity Logs",
          url: "/activity-logs",
          icon: Activity,
          isActive: pathname.includes("/activity-logs"),
        },
      ]
    }

    if (currentRole === "instructor") {
      return [
        ...commonItems,
        {
          title: "Attendance",
          url: "/instructor-view/attendance",
          icon: Calendar,
          isActive: pathname.includes("/attendance"),
        },
        {
          title: "Clinicians",
          url: "/instructor-view/clinicians",
          icon: Users,
          isActive: pathname.includes("/clinicians"),
        },
        {
          title: "Activities",
          url: "/instructor-view/activities",
          icon: FileText,
          isActive: pathname.includes("/activities"),
        },
      ]
    }

    if (currentRole === "clerk") {
      return [
        ...commonItems,
        {
          title: "Attendance",
          url: "/clerk-view/attendance",
          icon: Calendar,
          isActive: pathname.includes("/attendance"),
        },
        {
          title: "Dental Chairs",
          url: "/clerk-view/chair",
          icon: Armchair,
          isActive: pathname.includes("/chair"),
        },
      ]
    }

    if (currentRole === "clinician") {
      return [
        ...commonItems,
        {
          title: "Activities",
          url: "/clinician-view/activities",
          icon: FileText,
          isActive: pathname.includes("/activities"),
        },
        {
          title: "Dental Chairs",
          url: "/clinician-view/chair",
          icon: Armchair,
          isActive: pathname.includes("/chair"),
        },
        {
          title: "Records",
          url: "/clinician-view/records",
          icon: ClipboardList,
          isActive: pathname.includes("/records"),
        },
        {
          title: "Form",
          url: "/clinician-view/form",
          icon: FormInput,
          isActive: pathname.includes("/form"),
        },
      ]
    }

    return commonItems
  }

  const navigationItems = getNavigationItems()

  return (
    <SidebarProvider>
      {/* Left Navbar (Sidebar) */}
      <Sidebar className="border-r border-gray-200 bg-white">
        <SidebarHeader className="border-b border-gray-200 p-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <div className="h-10 w-10 flex items-center justify-center">
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="De Ocampo Memorial College logo"
                width={40}
                height={40}
                className="rounded-md"
              />
            </div>
            <div>
              <div className="font-semibold text-[#333] text-sm">De Ocampo Memorial College</div>
              <div className="text-xs text-gray-500">845 Euclid Avenue, Manila</div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      className="w-full justify-start data-[active=true]:bg-[#e6f7eb] data-[active=true]:text-[#5C8E77] hover:bg-gray-100 rounded-md"
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col bg-[#f8f9fa]">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8 hover:bg-gray-100" />
              <h1 className="text-xl font-semibold text-[#333]">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search for anything here..."
                  className="w-64 pl-9 rounded-full bg-gray-100 border-gray-200 focus-visible:ring-[#5C8E77]/30"
                />
              </div>

              {/* Notifications */}
              <Button
                size="icon"
                variant="ghost"
                className="relative text-gray-500 hover:text-[#333] hover:bg-gray-100 h-10 w-10"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#5C8E77] text-white text-xs flex items-center justify-center">
                  1
                </span>
              </Button>

              {/* User Dropdown */}
              <UserRoleDropdown currentRole={currentRole} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
