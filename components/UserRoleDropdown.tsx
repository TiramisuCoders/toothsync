"use client"

import { useState } from "react"
import { ChevronDown, User, Users, ClipboardList } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

type UserRole = "admin" | "instructor" | "clinician" | "clerk"

interface UserRoleDropdownProps {
  currentRole?: UserRole
}

export function UserRoleDropdown({ currentRole = "admin" }: UserRoleDropdownProps) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)

    // Navigate to the appropriate dashboard based on role
    switch (newRole) {
      case "admin":
        router.push("/dashboard")
        break
      case "instructor":
        router.push("/instructor-view")
        break
      case "clinician":
        router.push("/clinician-view")
        break
      case "clerk":
        router.push("/clerk-view")
        break
    }
  }

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case "admin":
        return { name: "Admin User", role: "Super admin" }
      case "instructor":
        return { name: "Doc. Sales", role: "Instructor" }
      case "clinician":
        return { name: "Maria Santos", role: "Clinician" }
      case "clerk":
        return { name: "John Clerk", role: "Clerk" }
    }
  }

  const currentDisplay = getRoleDisplay(role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-50">
          <div className="h-8 w-8 rounded-full bg-[#e6f7eb] flex items-center justify-center">
            <User className="h-4 w-4 text-[#5C8E77]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#333]">{currentDisplay.name}</div>
            <div className="text-xs text-gray-500">{currentDisplay.role}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className={role === "admin" ? "bg-gray-100" : ""} onClick={() => handleRoleChange("admin")}>
          <User className="mr-2 h-4 w-4" />
          <span>Admin</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={role === "instructor" ? "bg-gray-100" : ""}
          onClick={() => handleRoleChange("instructor")}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Instructor</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={role === "clinician" ? "bg-gray-100" : ""}
          onClick={() => handleRoleChange("clinician")}
        >
          <Users className="mr-2 h-4 w-4" />
          <span>Clinician</span>
        </DropdownMenuItem>
        <DropdownMenuItem className={role === "clerk" ? "bg-gray-100" : ""} onClick={() => handleRoleChange("clerk")}>
          <ClipboardList className="mr-2 h-4 w-4" />
          <span>Clerk</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
