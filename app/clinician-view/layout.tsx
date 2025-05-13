import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout currentRole="clinician">{children}</DashboardLayout>
}
