"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, Search, User, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutModal } from "@/components/modals/sign-out-modal"

export function Header() {
  const router = useRouter()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  useEffect(() => {
    const syncRole = () => {
      const cookieRole = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1]

      const localRole = localStorage.getItem("role")

      const role = cookieRole || localRole

      console.log("[v0] Role sync - Cookie:", cookieRole, "Local:", localRole, "Using:", role)

      setCurrentRole(role)

      if (cookieRole && cookieRole !== localRole) {
        localStorage.setItem("role", cookieRole)
      }
    }

    syncRole()

    const handleStorageChange = () => {
      syncRole()
    }

    window.addEventListener("storage", handleStorageChange)

    window.addEventListener("focus", syncRole)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", syncRole)
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("role")
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    setCurrentRole(null)
    router.push("/")
  }

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
  }

  const handleConfirmSignOut = () => {
    handleSignOut()
  }

  const handleProfileClick = () => {
    console.log("[v0] Profile click - Current role:", currentRole)

    if (!currentRole) {
      console.warn("[v0] No role found, redirecting to landing")
      router.push("/")
      return
    }

    const rolePathMap: Record<string, string> = {
      "chief-of-clinicians": "chief-of-clinicians",
      "clinical-instructor": "clinical-instructor",
      clinician: "clinician",
      clerk: "clerk",
    }

    const profilePath = rolePathMap[currentRole] || currentRole
    console.log("[v0] Navigating to profile:", `/profile/${profilePath}`)

    router.push(`/profile/${profilePath}`)
  }

  const handleSupportClick = () => {
    router.push("/support/faq")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 text-foreground shadow-sm">
        <div className="hidden sm:block"></div>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search for anything..." className="w-full pl-10" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
              1
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="text-right">
                  <p className="text-sm font-medium leading-none">Profile</p>
                  <p className="text-xs text-muted-foreground">{currentRole || "No Role"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSupportClick}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SignOutModal open={showSignOutModal} onOpenChange={setShowSignOutModal} onConfirm={handleConfirmSignOut} />
    </>
  )
}

export default Header
