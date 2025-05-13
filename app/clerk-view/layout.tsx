import type { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ClerkLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout currentRole="clerk">{children}</DashboardLayout>
}
