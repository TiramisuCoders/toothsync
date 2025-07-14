"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  FormInput,
  AlertTriangle,
  ActivityIcon,
  RockingChairIcon as Chair,
  BarChartIcon as ChartBar,
  type LucideIcon,
} from "lucide-react"

import { Sidebar } from "@/components/ui/sidebar"
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/sidebar/SideBarMenu"

interface RoleBasedSidebarProps {
  role: "clinician" | "instructor" | "clerk" | "chief"
}

const getIconForTitle = (title: string): LucideIcon => {
  switch (title) {
    case "Dashboard":
      return LayoutGrid
    case "Attendance":
      return Calendar
    case "Clinicians":
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
    default:
      return FileText
  }
}

export const RoleBasedSidebar = ({ role }: RoleBasedSidebarProps) => {
  const pathname = usePathname()

  const chiefMenu = [
    { title: "Dashboard", url: "/dashboard/chief-of-clinicians" },
    { title: "Attendance", url: "/attendance/chief-of-clinicians" },
    { title: "Clinicians", url: "/clinicians/chief-of-clinicians" },
    { title: "Activities", url: "/activities/chief-of-clinicians" },
    { title: "Dental Chairs", url: "/dental-chairs/chief-of-clinicians" },
    { title: "Instructor", url: "/instructor/chief-of-clinicians" },
    { title: "Reports", url: "/reports/chief-of-clinicians" },
    { title: "Incident Logs", url: "/incident-logs/chief-of-clinicians" },
    { title: "Activity Logs", url: "/activity-logs/chief-of-clinicians" },
  ]

  const instructorMenu = [
    { title: "Dashboard", url: "/dashboard/clinical-instructor" },
    { title: "Attendance", url: "/attendance/clinical-instructor" },
    { title: "Clinicians", url: "/clinicians/clinical-instructor" },
    { title: "Activities", url: "/activities/clinical-instructor" },
  ]

  const clerkMenu = [
    { title: "Dashboard", url: "/dashboard/clerk" },
    { title: "Attendance", url: "/attendance/clerk" },
    { title: "Dental Chairs", url: "/dental-chairs/clerk" },
  ]

  const clinicianMenu = [
    { title: "Dashboard", url: "/dashboard/clinician" },
    { title: "Activities", url: "/activities/clinician" },
    { title: "Dental Chairs", url: "/dental-chairs/clinician" },
    { title: "Records", url: "/records/clinician" },
    { title: "Form", url: "/form/clinician" },
  ]

  const menu =
    role === "chief"
      ? chiefMenu
      : role === "instructor"
      ? instructorMenu
      : role === "clerk"
      ? clerkMenu
      : clinicianMenu

  return (
    <Sidebar className="bg-white border-r border-gray-200 w-64">
      <div>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#5C8E77] rounded-lg flex items-center justify-center">
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
            <span className="text-xl font-semibold text-gray-900">ToothSync</span>
          </div>
          <div className="border-b border-gray-100" />
        </div>

        <div className="px-6 pb-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image
                src="/images/DOMC-logo.png"
                alt="De Ocampo Memorial College"
                width={32}
                height={32}
                className="rounded-md"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                De Ocampo Memorial College
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                845 Euclid Avenue, Manila
              </p>
            </div>
          </div>
        </div>
      </div>

      <SidebarContent>
        <SidebarMenu>
          {menu.map((item) => {
            const isActive = pathname === item.url || pathname.includes(item.url)
            const Icon = getIconForTitle(item.title)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#5C8E77]/10 text-[#5C8E77]"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? "text-[#5C8E77]" : "text-gray-500"
                      }`}
                    />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
