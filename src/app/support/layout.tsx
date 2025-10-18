import SupportLayout from "@/components/layouts/SupportLayout"
import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SupportLayout>{children}</SupportLayout>
}