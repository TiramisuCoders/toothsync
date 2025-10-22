"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, User, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutModal } from "@/components/modals/sign-out-modal"
import { signOut } from "@/app/actions/sign-out"

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

  const handleSignOut = async () => {
    localStorage.removeItem("role")
    setCurrentRole(null)
    await signOut()
  }

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
  }

  const handleConfirmSignOut = () => {
    handleSignOut()
  }

  const handleProfileClick = () => {
    if (!currentRole) {
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
    router.push(`/profile/${profilePath}`)
  }

  const handleSupportClick = () => {
    router.push("/support/faq")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 sm:left-64 z-40 flex h-16 items-center justify-end border-b bg-background px-4 text-foreground shadow-sm">
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
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOutClick} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <SignOutModal open={showSignOutModal} onOpenChange={setShowSignOutModal} onConfirm={handleConfirmSignOut} />
    </>
  )
}

export default Header
