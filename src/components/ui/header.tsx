"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, Search, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserData {
  firstName: string
  lastName: string
  role: "Chief" | "Clinician" | "Instructor" | "Clerk"
}

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        console.error("Invalid user data in localStorage.")
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-2 sm:px-4 text-foreground shadow-sm">

    

      {/* Right Icons */}
      <div className="flex justify-end gap-1 sm:gap-4 ml-auto">
        {/* Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
            1
          </span>
        </Button>

        {/*  User Menu - Full text on sm and up, icon only on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
              {/*  Hide user info text on mobile, show only on sm and up */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : "Profile"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || "Loading..."}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
