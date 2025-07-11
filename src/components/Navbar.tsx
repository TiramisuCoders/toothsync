"use client"

import type React from "react"

import { DashboardLayout } from "./dashboard-layout"

interface NavbarProps {
  children?: React.ReactNode
  currentRole?: "admin" | "instructor" | "clinician" | "clerk"
}

export default function Navbar({ children, currentRole = "admin" }: NavbarProps) {
  return <DashboardLayout currentRole={currentRole}>{children}</DashboardLayout>
}
