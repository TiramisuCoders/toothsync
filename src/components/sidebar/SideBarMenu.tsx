"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot" // Needed for proper asChild support
import { cn } from "@/lib/utils"

export const SidebarContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col flex-1 overflow-y-auto">{children}</div>
)

export const SidebarMenu = ({ children }: { children: React.ReactNode }) => (
  <nav className="flex flex-col gap-1 px-2 py-4">{children}</nav>
)

export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full">{children}</div>
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        "w-full text-left px-4 py-2 rounded-md hover:bg-muted transition-colors",
        className
      )}
      {...props}
    />
  )
})

SidebarMenuButton.displayName = "SidebarMenuButton"
