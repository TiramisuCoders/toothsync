"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserRoleDropdownProps {
  currentRole?: "admin" | "instructor" | "clinician" | "clerk"
}

export function UserRoleDropdown({ currentRole = "admin" }: UserRoleDropdownProps) {
  const router = useRouter()

  // Get user name based on role
  const getUserName = () => {
    switch (currentRole) {
      case "instructor":
        return "Doc. Sales"
      case "clinician":
        return "Maria Santos"
      case "clerk":
        return "Clerk User"
      default:
        return "Admin User"
    }
  }

  const handleRoleChange = (role: string) => {
    switch (role) {
      case "instructor":
        router.push("/instructor-view")
        break
      case "clinician":
        router.push("/clinician-view")
        break
      case "clerk":
        router.push("/clerk-view")
        break
      case "admin":
        router.push("/dashboard")
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt={getUserName()} />
            <AvatarFallback className="bg-[#5C8E77] text-white">{getUserName().charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-semibold text-[#333]">{getUserName()}</span>
            <span className="text-xs text-gray-500 capitalize">{currentRole}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={currentRole === "admin" ? "bg-[#e6f7eb] text-[#5C8E77]" : ""}
          onClick={() => handleRoleChange("admin")}
        >
          Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          className={currentRole === "instructor" ? "bg-[#e6f7eb] text-[#5C8E77]" : ""}
          onClick={() => handleRoleChange("instructor")}
        >
          Instructor
        </DropdownMenuItem>
        <DropdownMenuItem
          className={currentRole === "clinician" ? "bg-[#e6f7eb] text-[#5C8E77]" : ""}
          onClick={() => handleRoleChange("clinician")}
        >
          Clinician
        </DropdownMenuItem>
        <DropdownMenuItem
          className={currentRole === "clerk" ? "bg-[#e6f7eb] text-[#5C8E77]" : ""}
          onClick={() => handleRoleChange("clerk")}
        >
          Clerk
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/profile" className="flex w-full">
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/settings" className="flex w-full">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <Link href="/logout" className="flex w-full">
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
