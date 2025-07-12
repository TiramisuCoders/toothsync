"use client"

import { ChevronDown, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserRoleDropdownProps {
  currentRole: "admin" | "instructor" | "clinician" | "clerk"
}

export function UserRoleDropdown({ currentRole }: UserRoleDropdownProps) {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator"
      case "instructor":
        return "Instructor"
      case "clinician":
        return "Clinician"
      case "clerk":
        return "Clerk"
      default:
        return "User"
    }
  }

  const getRoleInitials = (role: string) => {
    switch (role) {
      case "admin":
        return "AD"
      case "instructor":
        return "IN"
      case "clinician":
        return "CL"
      case "clerk":
        return "CR"
      default:
        return "U"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 h-auto py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#5C8E77] text-white text-xs">{getRoleInitials(currentRole)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-[#333]">John Doe</span>
            <span className="text-xs text-gray-500">{getRoleDisplayName(currentRole)}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
