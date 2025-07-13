"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  FileText,
  Armchair,
  AlertTriangle,
  Activity,
} from "lucide-react"

import { Sidebar } from "@/components/ui/sidebar"
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/sidebar/SideBarMenu"

interface RoleBasedSidebarProps {
  role: "clinician"
}

export const RoleBasedSidebar = ({ role }: RoleBasedSidebarProps) => {
  const pathname = usePathname()

  // Define clinician-specific sidebar items
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
      icon: Armchair,
    },
    {
      title: "Records",
      url: "/records",
      icon: AlertTriangle,
    },
    {
      title: "Form",
      url: "/form",
      icon: Activity,
    },
  ]

  return (
    <Sidebar className="bg-white border-r border-gray-200 w-64">
      <SidebarContent>
        <SidebarMenu>
          {clinicianMenu.map((item) => {
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
