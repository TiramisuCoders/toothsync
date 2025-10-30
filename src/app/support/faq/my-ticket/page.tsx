// app/support/faq/my-ticket/page.tsx
"use client"

import MyTicketForm from "./MyTicketForm" // 🟢 Import the core logic component

export default function MyTicketPage() {
  // The outer layout (SupportLayout) handles the sidebar and padding.
  return (
    <div className="py-8 px-4 md:px-8 bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">View My Tickets</h1>
      <MyTicketForm />
    </div>
  )
}