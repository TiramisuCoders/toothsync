"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Calendar,
  Users,
  FileText,
} from "lucide-react"

import { Sidebar } from "@/components/ui/sidebar"
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/sidebar/SideBarMenu"

interface RoleBasedSidebarProps {
  role: "clinician" | "instructor"
}

export const RoleBasedSidebar = ({ role }: RoleBasedSidebarProps) => {
  const pathname = usePathname()

  const clinicianMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Activities",
      url: "/activities",
      icon: FileText,
    },
    {
      title: "Dental Chairs",
      url: "/dental-chairs",
      icon: FileText,
    },
    {
      title: "Records",
      url: "/records",
      icon: FileText,
    },
    {
      title: "Form",
      url: "/form",
      icon: FileText,
    },
  ]

  const instructorMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: Calendar,
    },
    {
      title: "Clinicians",
      url: "/clinicians",
      icon: Users,
    },
    {
      title: "Activities",
      url: "/activities",
      icon: FileText,
    },
  ]

  const menu = role === "instructor" ? instructorMenu : clinicianMenu

  return (
    <Sidebar className="bg-white border-r border-gray-200 w-64">
      {/* Header Section */}
      <div>
        <div className="p-6 pb-4">
          {/* Logo */}
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

          {/* Divider */}
          <div className="border-b border-gray-100" />
        </div>

        {/* College Info */}
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
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">De Ocampo Memorial College</h3>
              <p className="text-xs text-gray-500 mt-1">845 Euclid Avenue, Manila</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <SidebarContent>
        <SidebarMenu>
          {menu.map((item) => {
            const isActive = pathname === item.url || pathname.includes(item.url)
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
                    <item.icon className={`w-5 h-5 ${isActive ? "text-[#5C8E77]" : "text-gray-500"}`} />
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
